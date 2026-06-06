# 赚了么 - 微信记账小程序

一款帮助用户记录彩票、刮刮乐、麻将收支的微信小程序，支持全用户排行榜功能。

## 功能特性

- **三种记账类型**：彩、刮、麻
- **记录管理**：支持新增、编辑、删除记录
- **个人统计**：年度总盈亏、分类盈亏、最近记录
- **全用户排行榜**：总排行、分类排行
- **个人中心**：自定义昵称、头像、生日
- **个性化设置**：自定义赢色/亏色
- **趣味游戏**：拱猪等小游戏

## 技术栈

- **前端**：微信小程序原生开发
- **后端**：Spring Boot 3.4.5 + JPA + Flyway（REST API）
- **数据库**：MySQL 8.0
- **认证**：微信 code2session + JWT Bearer Token
- **部署**：Docker + 阿里云 ECS

## 项目结构

```
earned-or-not/
├── app.js.template          # 小程序入口模板
├── app.json                  # 全局配置
├── app.wxss                  # 全局样式
├── utils/
│   ├── api.js.template       # API 封装模板
│   └── api.js                # API 封装（gitignore）
├── cloud/                    # 云函数（拱猪等遗留）
│   └── functions/
├── pages/                    # 小程序页面
│   ├── index/                # 首页
│   ├── record/               # 记账
│   ├── stats/                # 统计
│   ├── rank/                 # 排行榜
│   ├── profile/              # 我的
│   ├── settings/             # 设置
│   ├── record-list/          # 分类记录列表
│   └── fortune/              # 每日运势
├── earned-or-not-server/     # Spring Boot 后端
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/main/
│       ├── java/com/earnedornot/
│       │   ├── controller/   # REST 控制器
│       │   ├── service/      # 业务逻辑
│       │   ├── entity/       # JPA 实体
│       │   ├── repository/   # 数据访问
│       │   ├── dto/          # 传输对象
│       │   ├── config/       # 配置类
│       │   └── common/       # 工具类（JWT、异常处理）
│       └── resources/
│           └── db/migration/ # Flyway 数据库迁移脚本
└── images/                   # 图片资源
```

## 配置文件说明

以下文件包含敏感信息（数据库密码、API 密钥等），已通过 `.gitignore` 排除。
部署时需根据模板文件手动创建：

| 文件 | 模板 | 说明 |
|---|---|---|
| `app.js` | `app.js.template` | 小程序入口，含云环境 ID |
| `utils/api.js` | `utils/api.js.template` | REST API 封装，含后端服务器地址 |
| `project.config.json` | 无模板，见下方 | 小程序项目配置，含 appId |
| `earned-or-not-server/src/main/resources/application.yml` | 无模板，见下方 | 后端配置：数据库、微信、JWT |

### app.js

复制 `app.js.template` 为 `app.js`。如需使用云开发功能（拱猪等），将 `env` 字段替换为你的云环境 ID。

### utils/api.js

复制 `utils/api.js.template` 为 `api.js`，将 `BASE_URL` 替换为你的后端服务地址。

```js
const BASE_URL = 'http://YOUR_SERVER_IP:8081';
```

### project.config.json

微信开发者工具会自动生成，主要关注 `appid` 字段：

```json
{
  "description": "赚了么",
  "compileType": "miniprogram",
  "appid": "你的小程序AppID",
  "projectname": "earned-or-not",
  "cloudfunctionRoot": "cloud/functions/",
  "setting": { "urlCheck": false, "es6": true },
  "libVersion": "2.30.0"
}
```

### application.yml

后端核心配置，放到 `earned-or-not-server/src/main/resources/application.yml`。
支持环境变量覆盖（推荐生产环境通过 Docker `-e` 注入敏感值）：

```yaml
server:
  port: 8081

spring:
  datasource:
    url: jdbc:mysql://你的MySQL地址:3306/lottery?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true
    username: 数据库用户名
    password: 数据库密码
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    open-in-view: false
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

wechat:
  app-id: ${WECHAT_APP_ID:你的小程序AppID}
  app-secret: ${WECHAT_APP_SECRET:你的小程序AppSecret}

jwt:
  secret: ${JWT_SECRET:至少32字符的随机密钥}
  expiration: 604800000

logging:
  level:
    com.earnedornot: DEBUG
```

**环境变量说明**（Docker 部署时通过 `-e` 传入）：

| 变量 | 说明 | 默认值 |
|---|---|---|
| `WECHAT_APP_ID` | 微信小程序 AppID | yml 中 fallback 值 |
| `WECHAT_APP_SECRET` | 微信小程序 AppSecret | yml 中 fallback 值 |
| `JWT_SECRET` | JWT 签名密钥（≥32字符） | yml 中 fallback 值 |

## 部署

### 1. 后端

```bash
# 构建 Docker 镜像
cd earned-or-not-server
docker build -t lottery .

# 启动容器
docker run -d --name lottery -p 8081:8081 \
  -e WECHAT_APP_ID=你的AppID \
  -e WECHAT_APP_SECRET=你的AppSecret \
  -e JWT_SECRET=你的JWT密钥 \
  lottery
```

数据库表由 Flyway 在启动时自动创建。

### 2. 前端

1. 根据上方配置文件说明创建 `app.js`、`utils/api.js`、`project.config.json`
2. 微信开发者工具打开项目
3. 上传云函数（如使用拱猪等云功能）
4. 预览/上传小程序

## REST API 概览

| 方法 | 路径 | 说明 | 认证 |
|---|---|---|---|
| POST | `/api/user/login` | 微信登录，返回 JWT | 否 |
| GET | `/api/user/profile` | 获取用户信息 | 是 |
| PUT | `/api/user/profile` | 更新用户信息 | 是 |
| POST | `/api/records` | 新增记录 | 是 |
| GET | `/api/records/{id}` | 获取单条记录 | 是 |
| PUT | `/api/records/{id}` | 编辑记录 | 是 |
| DELETE | `/api/records/{id}` | 删除记录 | 是 |
| GET | `/api/records/last-win` | 上次中奖金额 | 是 |
| GET | `/api/stats/personal` | 个人统计 | 是 |
| GET | `/api/stats/recent` | 最近记录 | 是 |
| GET | `/api/stats/records` | 分类记录（分页） | 是 |
| GET | `/api/rank` | 排行榜 | 是 |

## 数据库设计

### users 表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGINT | 雪花算法主键 |
| openid | VARCHAR(64) | 微信 openid |
| nickname | VARCHAR(64) | 昵称 |
| avatar_url | VARCHAR(512) | 微信头像 |
| custom_avatar_url | VARCHAR(512) | 自定义头像 |
| birthday | DATE | 生日 |
| win_color | VARCHAR(16) | 自定义赢色 |
| lose_color | VARCHAR(16) | 自定义亏色 |
| total_net | DECIMAL(12,2) | 总盈亏（缓存） |
| lottery_net | DECIMAL(12,2) | 彩票盈亏（缓存） |
| scratch_net | DECIMAL(12,2) | 刮刮乐盈亏（缓存） |
| mahjong_net | DECIMAL(12,2) | 麻将盈亏（缓存） |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

### records 表

| 字段 | 类型 | 说明 |
|---|---|---|
| id | BIGINT | 自增主键 |
| user_id | BIGINT | FK → users.id |
| record_type | VARCHAR(16) | LOTTERY / SCRATCH / MAHJONG |
| cost | DECIMAL(10,2) | 花费 |
| win_amount | DECIMAL(10,2) | 中奖金额 |
| amount | DECIMAL(10,2) | 麻将盈亏 |
| lottery_type | VARCHAR(32) | 彩票子类型 |
| remark | VARCHAR(256) | 备注 |
| create_time | DATETIME | 创建时间 |
| update_time | DATETIME | 更新时间 |

## 更新日志

### v3.0.0 (2026-06)
- 重构：后端从微信云开发迁移到 Spring Boot + MySQL
- 新增：REST API 全套接口（12个端点）
- 新增：JWT 认证 + 微信 code2session 登录
- 新增：Flyway 数据库版本管理
- 新增：Docker 容器化部署
- 优化：记录增删改时原子更新用户缓存净值

### v2.2.0 (2026-03-26)
- 新增：拱猪游戏（2v2组队版）
- 新增：趣玩页面，集成5款小游戏
- 优化：24点数字只能使用一次
- 拱猪规则：猪羊定队、分数平均、满红+200、大满贯翻倍
- 拱猪出牌：♠J先出，横屏布局

### v2.1.2 (2026-03-20)
- 新增：每日运势功能，支持星座运势分析
- 新增：生日设置，自动计算星座
- 新增：分类记录详情页，支持分页加载
- 优化：排行榜分页加载，提升性能
- 优化：敏感词替换（彩票→彩，刮刮乐→刮）
- 修复：星座计算算法
- 修复：记录列表颜色应用用户设置

### v1.2.0 (2026-03-15)
- 新增：设置页面，支持自定义赢色/亏色（8种颜色可选）
- 新增：小程序分享功能（分享给朋友、分享到朋友圈）
- 优化：首页、战绩、统计、排行均应用用户自定义颜色
- 优化：排行榜头像使用云存储链接，解决微信头像过期问题
- 优化：头像本地缓存，减少重复加载
- 修复：云存储 fileID 自动转换为 HTTPS URL

### v1.1.0 (2026-03-06)
- 重构：好友系统改为全用户排行榜
- 新增：个人中心页面（设置昵称、头像）
- 新增：记录编辑和删除功能
- 新增：总排行榜
- 优化：首页样式和交互
- 优化：自定义操作菜单样式
- 修复：新用户自动创建记录
- 修复：删除权限检查

### v1.0.0 (2026-03-05)
- 基础功能完成
- 支持彩、刮、麻记账
- 个人统计页面
- 好友系统

## 开发团队

- 产品 & 设计：lrp1223
- 开发：18million (AI Assistant)

## 趣玩游戏

### 拱猪（2v2组队版）

经典4人纸牌游戏，2v2组队玩法。

**特殊牌分值：**
| 牌 | 分值 |
|---|---|
| ♠Q 猪 | -100 |
| ♦J 羊 | +100 |
| ♣10 变压器 | ×2 或 +50 |
| ♥ 红桃 | -10至-50 |

**出牌规则：**
- ♠J 先出，第一轮必须出 ♠J
- 跟花色，无则垫牌
- 同花色最大者赢本轮

**组队规则：**
- 猪羊定队：猪羊同一人=跟对家组队，不同人=这两人组队
- 队友分数相加后平分

**特殊计分：**
- 满红（13张红桃）：+200分
- 大满贯（猪羊红桃全收）：猪+100，羊+100，红桃+200，变压器再×2

## License

MIT
