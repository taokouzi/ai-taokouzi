# 域名、服务器白嫖 完整详细步骤

> 
> 架构总览（**0 域名、0 服务器，全部用平台免费二级域名**）

1. 博客客户端（用户看文章）：**GitHub Pages → `https://你的id.github.io`**
2. 管理后台前端（写文章网页）：**Vercel → `xxx.vercel.app`**
3. API 后端 (Node/Express)：**Render Web Service → `xxx.onrender.com`**
4. 数据库：Render 免费 PostgreSQL

> 
> ⚠️Render 免费 Web Service：**闲置 15 分钟自动休眠，首次访问几十秒冷启动；免费 PG 数据最多保存 90 天**GitHub
> ⚠️跨域必须后端配置，前端无法绕过 CORS；github.io 本身不能改响应头GitHub

## 前置准备

1. GitHub 账号（存全部代码）
2. Render 账号，用 GitHub 登录 [https://render.com](https://render.com)
3. Vercel 账号，用 GitHub 登录 [https://vercel.com](https://vercel.com)
4. 项目目录结构参考（推荐 monorepo，一个 git 仓库管理全部代码）

```
blog-project/
├─ client/        #博客客户端前端，打包后部署GitHub Pages
├─ admin/         #管理后台前端，打包部署Vercel
└─ backend/       #Node Express后端API，部署Render
```

---

## 第 1 步：后端代码准备（backend）

以 Node + Express 举例

### 1‑1 初始化后端

```
mkdir backend && cd backend
npm init -y
npm i express cors pg jsonwebtoken dotenv
```

`backend/src/server.js` 最小示例，**重点写死 CORS 逻辑**GitHub

```
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')

const app = express()
const PORT = process.env.PORT || 3000

// ✅关键：允许两个前端源，把后面得到的域名填进来
const allowedOrigins = [
  "https://你的id.github.io",        //github.io博客客户端
  "https://xxx.vercel.app"           //vercel管理后台域名（后面拿到再填）
]

app.use(cors({
  origin: (origin, cb)=>{
    if(!origin || allowedOrigins.includes(origin)){
      cb(null,true)
    }else{
      cb(new Error("跨域拒绝"))
    }
  },
  credentials:true
}))

app.use(express.json())

//数据库连接
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:{rejectUnauthorized:false}
})

//测试接口
app.get('/api/ping',(req,res)=>{
  res.json({msg:"ok"})
})

//示例：获取文章列表接口
app.get('/api/articles',async (req,res)=>{
  const result = await pool.query("select * from articles order by id desc")
  res.json(result.rows)
})

app.listen(PORT,()=>console.log("server start"))
```

`backend/package.json` scripts

```
"scripts": {
  "start": "node src/server.js"
}
```

> 
> 本地`.env`不要提交 git，Render 后台页面配置环境变量。

### 1‑2 推送到 GitHub

把整个`blog-project`推送到 GitHub 公开仓库。

---

## 第 2 步：Render 创建 PostgreSQL 免费数据库Princeton ...

1. Render 控制台 → 右上角 `+ New` → **PostgreSQL**
2. 参数填写

- Name：blog‑pg（随便起名）
- Region：Singapore（离国内最近）
- Plan：**Free**（免费）

3. 点击`Create Database`，等待 1‑2 分钟，状态变成 Available
4. 复制 **Internal Database URL**（内部连接地址，给后端用）保存好，后面要用。

> 
> ⚠️免费 PG 限制：数据最多保留 90 天，到期清空，适合练习；不要存唯一重要数据GitHub。

## 第 3 步：Render 部署后端 Web Service（API 服务）稀土掘金

1. Render 控制台 → `+ New` → **Web Service**
2. 选择 `Build and deploy from a Git repository`，授权并选中你的 GitHub 仓库
3. 配置关键参数：

表格

| 配置项 | 值 | 说明 |
| --- | --- | --- |
| Name | blog‑api | 生成域名：`blog‑api.onrender.com` |
| Root Directory | `backend` | ❗后端代码在仓库的 backend 子文件夹 |
| Environment | Node | 自动识别 |
| Build Command | `npm install` | 安装依赖 |
| Start Command | `npm start` | 启动命令 |
4. 往下找到 **Environment Variables** 添加环境变量：

```
DATABASE_URL  → 粘贴刚刚PG的Internal Database URL
NODE_ENV     → production
JWT_SECRET   → 自己随便写一串长字符串（登录鉴权用）
```

5. 点击 `Create Web Service`，开始构建部署，等待 2‑4 分钟。
6. 部署成功后复制 API 域名：`https://blog‑api.onrender.com`
7. 浏览器访问 `https://blog‑api.onrender.com/api/ping` 返回`{"msg":"ok"}`代表后端跑通。

> 
> ✨现在回到后端代码`allowedOrigins`数组，把还没有的**Vercel 管理后台域名**先占位，拿到域名后重新 push 代码，Render 会自动重新部署更新 CORS。

> 
> Render 免费层：15 分钟无访问休眠，第一次请求会卡几十秒。

## 第 4 步：部署管理后台前端到 Vercel

> 
> 管理后台前端代码在`admin`文件夹，Vite/Vue3/React 打包产物 dist。

1. 打开 Vercel，`Add New` → `Project`，导入同一个 GitHub 仓库
2. 配置：

- Root Directory：`admin`（管理后台代码目录）
- Framework Preset：Vite
- Build Command：`npm run build`
- Output Directory：`dist`

3. 环境变量添加：

```
VITE_API_BASE_URL = https://blog‑api.onrender.com
```

4. 点击 Deploy，等待构建完成，得到管理后台域名，例如 `https://blog‑admin.vercel.app`。

> 
> 📌现在把这个 vercel 域名补回到后端代码`allowedOrigins`数组，git push，Render 自动重新部署更新 CORS 规则。

## 第 5 步：部署博客客户端到 GitHub Pages

博客客户端代码：`client`文件夹。

### 方式 A：GitHub Actions 自动部署（推荐）

1. 在仓库根目录新建文件夹 `.github/workflows`，新建文件 `deploy‑client.yml`

```
name: Deploy Client to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu‑latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup‑node@v4
        with: {node‑version:20}
      - name: Install & Build
        working‑directory: ./client
        run: npm install && npm run build
      - name: Deploy
        uses: peaceiris/actions‑gh‑pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./client/dist
```

2. 仓库设置 → Settings → Pages
Source 选择：**GitHub Actions**
3. 客户端前端环境变量配置 API 地址：`VITE_API_BASE_URL=https://blog‑api.onrender.com`
4. git push main 分支，Actions 自动打包部署，几分钟后访问：
`https://你的用户名.github.io`

> 
> 注意：仓库名**不需要必须是用户名.github.io**，Actions 会自动处理；如果仓库名就是用户名.github.io，访问就是根域名。

---

## 第 6 步：数据库初始化，建 articles 表

两种方式建表：

1. 本地写 SQL 脚本，通过后端接口执行；
2. Render 数据库控制台，点击 PG 数据库 → `Console`，直接执行 SQL：

```
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT,
  create_at TIMESTAMP DEFAULT now()
);
```

## 第 7 步：完整链路测试

1. 打开管理后台 `xxx.vercel.app`，新增一篇文章（调用 Render 后端 API 写入 PG）
2. 打开博客页面 `xxx.github.io`，请求 `/api/articles` 读取文章展示。

> 
> 如果报 CORS 错误：
> 
> 
> 1. 确认后端`allowedOrigins`两个域名完整，带`https://`，无末尾斜杠
> 2. 修改代码 push 后，确认 Render 已经完成重新部署
> 3. 浏览器清除缓存，Network 看响应头`Access‑Control‑Allow‑Origin`

## 这套方案的硬限制（必须知道）

1. Render 免费 Web Service 休眠：没人访问 15 分钟休眠，第一次访问等待 20‑60 秒。
2. Render 免费 PostgreSQL **90 天数据清除**，重要文章记得备份 markdown。
3. GitHub.io 国内网络访问不稳定，偶尔打不开博客。
4. Vercel 国内部分网络访问受限。
5. 全部免费资源禁止放违规内容，会直接删除项目。

## 可选优化方案（解决 github.io 跨域痛点）

github.io 不能做代理，如果你不想忍受 CORS 风险，可以：
把博客客户端也部署 Vercel；github.io 只做备用镜像。