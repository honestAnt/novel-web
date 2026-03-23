# 老王小说网

沉浸式小说在线阅读网站，仿照起点小说阅读功能设计。

## 功能特性

- 小说列表展示，支持分类筛选和搜索
- 小说详情页，展示章节信息
- 收藏功能 (localStorage 存储)
- 沉浸式阅读器
  - 字体/字号/行距调节
  - 背景主题切换 (夜间/白天/护眼/墨水)
  - 键盘翻页 (← →)
  - 章节目录

## 技术栈

- **后端**: Node.js + Express + PostgreSQL
- **前端**: React 18 + Vite + CSS Modules

## 环境要求

- Node.js 18+
- PostgreSQL 14+

## 项目结构

```
novel-web/
├── server/              # Express 后端
│   ├── database.js      # 数据库连接
│   └── index.js        # API 接口
├── client/             # React 前端
│   ├── src/
│   │   ├── components/ # 组件
│   │   ├── pages/      # 页面
│   │   └── styles/     # 样式
│   └── vite.config.js
├── .env                # 环境变量
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
cd client && npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```bash
# 数据库配置
DATABASE_URL=postgresql://openclaw:openclaw123@localhost:5432/openclaw

# 服务器端口
PORT=3001
```

### 3. 启动开发服务器

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run server   # 后端 :3001
cd client && npm run dev  # 前端 :5173
```

### 4. 访问网站

打开浏览器访问 http://localhost:5173

## API 接口

| 接口 | 说明 |
|------|------|
| `GET /api/stories` | 获取小说列表 |
| `GET /api/stories/:id` | 获取小说详情 |
| `GET /api/stories/:id/chapters` | 获取章节列表 |
| `GET /api/chapters/:id` | 获取章节内容 |
| `GET /api/chapters/:id/adjacent` | 获取上一章/下一章 |
| `GET /api/genres` | 获取分类列表 |

## 生产构建

```bash
# 构建前端
cd client && npm run build

# 构建后的文件在 client/dist 目录
```
