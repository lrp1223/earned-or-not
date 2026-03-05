# 赚了么 - 彩票刮刮乐麻将记账小程序

## 项目结构

```
earned-or-not/
├── cloud/functions/     # 云函数
│   ├── user/
│   ├── lottery/
│   ├── scratch/
│   ├── mahjong/
│   ├── stats/
│   ├── friend/
│   └── rank/
├── pages/               # 小程序页面
│   ├── index/
│   ├── record/
│   ├── stats/
│   ├── rank/
│   └── friends/
├── app.js.template      # app.js 模板
├── app.json
├── app.wxss
└── .gitignore
```

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/lrp1223/earned-or-not.git
cd earned-or-not
```

### 2. 创建本地配置文件
```bash
# 复制模板
cp app.js.template app.js

# 编辑 app.js，填入你的环境ID
# env: 'cloud1-7g3rl3bk62f4e747'
```

### 3. 创建 project.config.json
```json
{
  "description": "赚了么",
  "setting": { "urlCheck": false, "es6": true },
  "compileType": "miniprogram",
  "libVersion": "2.30.0",
  "appid": "你的小程序appid",
  "projectname": "earned-or-not",
  "cloudfunctionRoot": "cloud/functions/"
}
```

### 4. 部署云函数
在微信开发者工具中：
1. 右键 `cloud/functions/user` → "创建并部署：云端安装依赖"
2. 依次部署其他6个云函数

### 5. 创建数据库集合
在云开发控制台创建：
- users
- lottery
- scratch
- mahjong
- friends

## 开发规范

- app.js 和 project.config.json 已加入 .gitignore，不提交到仓库
- 每次开发前 `git pull` 拉取最新代码
- 修改后提交 PR 或推送

## 功能列表

- [x] 彩票记账（双色球/大乐透）
- [x] 刮刮乐记账
- [x] 麻将输赢记录
- [x] 年度盈亏统计
- [x] 好友系统
- [x] 排行榜
- [ ] OCR识别（后续）
- [ ] 数据导出（后续）
