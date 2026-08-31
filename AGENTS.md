# AGENTS.md — 赚了么（earned-or-not）

微信记账小程序（彩/刮/麻收支 + 排行榜 + 小游戏），前端为微信小程序原生开发，后端为 Spring Boot。仓库文档与 commit message 均使用中文。

## 目录结构

- 根目录 = 小程序前端：`app.json`（页面注册/tabBar）、`pages/`（每页 4 件套 js/wxml/wxss/json）、`utils/api.js`（REST 封装）、`images/`
- `earned-or-not-server/` = Spring Boot 3.4.5 后端（Java 21，JPA + Flyway + MySQL，Lombok + Hutool）
- `cloud/functions/` = 云开发遗留代码，已迁移到自建后端，勿新增功能
- 后端分层：`controller/` → `service/` + `service/impl/` → `repository/` → `entity/`；DTO 在 `dto/`，认证过滤器/统一响应/全局异常在 `common/`

## 关键前提：gitignore 的本地配置文件

以下文件不入仓库、含敏感信息，新环境克隆后缺失会导致无法运行（模板见 README.md「配置文件说明」）：

- `app.js`（模板 `app.js.template`，含云环境 ID）
- `utils/api.js`（模板 `utils/api.js.template`，含后端 `BASE_URL`）
- `project.config.json`（含小程序 appId）
- `earned-or-not-server/src/main/resources/application.yml`（数据库/微信/JWT 配置）

**修改这些文件不会出现在 git status 中，注意不要误以为已提交。**

## 常用命令

```bash
# 后端构建（无 mvnw，用系统 mvn；当前无测试用例）
cd earned-or-not-server && mvn package -DskipTests

# 部署到生产（打包 → scp jar → 服务器 Docker 重建，容器名 lottery，端口 8081）
./deploy-to-server.sh

# 本地跑后端（需先配置 application.yml）
cd earned-or-not-server && mvn spring-boot:run
```

前端无构建/测试流程，用微信开发者工具打开仓库根目录编译预览。

## 架构与约定

- **认证**：小程序 `wx.login` 拿 code → `POST /api/user/identify` 换 shareKey → 之后所有请求带 `X-Share-Key` header。前端收到 401 会自动重新 identify 并重试一次（见 `utils/api.js` 的 request 封装）。
- **统一响应**：所有接口返回 `Result<T>`（`{success, message, data}`，见 `common/Result.java`）。
- **ID 精度**：用户主键为雪花 ID，超出 JS Number 安全范围。**任何下发给前端的 Long ID 必须序列化为 String**（如 `RankVO.userId` 用 `String.valueOf()`），这是多次修过的线上 bug，新增 VO 时务必注意。
- **缓存净值**：`users` 表的 `total_net` / `lottery_net` / `scratch_net` / `mahjong_net` 是缓存列，记录增删改时原子更新，不要在查询时临时全量重算。
- **数据库变更**：一律新增 `db/migration/V<n>__xxx.sql`（Flyway，`ddl-auto: validate`），禁止修改已应用的迁移脚本、禁止改实体后靠 Hibernate 建表。
- **小程序兼容**：老版本前端可能长期不更新，后端接口改动尽量保持向后兼容（参考 commit「排行榜头像改为公开图片URL，旧前端无需更新即可展示」的思路）。

## 敏感信息

生产服务器 IP、SSH alias `sshmy`、微信 AppSecret、JWT 密钥、数据库密码只存在于本地 gitignore 文件和 README 示例中，不要写进代码或新文档。
