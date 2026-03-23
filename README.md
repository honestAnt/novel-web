# 小说在线网站规格文档

## 1. 项目概述

- **项目名称**: 起点风格小说阅读网
- **项目类型**: Web 应用 (Node.js + Express + React)
- **核心功能**: 小说展示、搜索、收藏、沉浸式阅读
- **目标用户**: 小说爱好者

## 2. 技术栈

### 后端
- Node.js + Express
- PostgreSQL (使用 pg 库)
- CORS 支持

### 前端
- React 18
- React Router v6
- Vite 构建
- CSS Modules

## 3. UI/UX 规格

### 颜色方案 (暗色沉浸主题)
- 背景色: `#1a1a2e` (深紫蓝)
- 卡片背景: `#16213e` (深蓝)
- 文字主色: `#e8e8e8`
- 文字次色: `#a0a0a0`
- 强调色: `#e94560` (玫红)
- 辅助色: `#ffc107` (金色，用于收藏按钮)
- 边框色: `#2a2a4a`

### 字体
- 标题: "Noto Serif SC", serif
- 正文: "Noto Sans SC", sans-serif
- 阅读正文: "LXGW WenKai", "Noto Serif SC", serif (更适合阅读)

### 布局
- 响应式设计， breakpoints: 768px, 1024px
- 最大内容宽度: 1200px
- 卡片网格: 4列桌面，2列平板，1列手机

### 页面结构

#### 首页
- 顶部导航栏（固定）
- 搜索框（居中，大字体）
- 小说分类筛选
- 小说卡片网格展示
- 底部信息

#### 小说详情页
- 封面图（左侧）
- 小说信息（右侧：标题、作者、类型、简介、最新章节等）
- 目录按钮
- 开始阅读/继续阅读按钮
- 收藏按钮（带动画）
- 章节列表

#### 阅读页面（核心）
- 顶部工具栏（隐藏/显示切换）
  - 返回按钮
  - 章节标题
  - 字体设置按钮
  - 亮度调节
  - 目录按钮
- 中央阅读区域（居中，最大宽度800px）
- 底部翻页控制
  - 上一章按钮
  - 章节进度指示（当前章节/总章节）
  - 下一章按钮
- 右侧悬浮目录（可收起）
- 底部进度条

### 组件

#### 小说卡片
- 封面图（宽高比 3:4）
- 标题（最多显示2行）
- 类型标签
- 最新章节标题
- 字数统计
- 悬停效果：轻微上浮 + 阴影加深

#### 收藏按钮
- 未收藏：空心星形
- 已收藏：实心金色星形 + 轻微放大动画
- 点击时心形动画

#### 阅读器设置面板
- 字体大小滑块（14px-24px）
- 亮度调节（背景色调整）
- 行高调节

## 4. 功能规格

### 后端 API

#### GET /api/stories
获取小说列表
- query: `?genre=xxx&search=xxx&page=1&limit=12`

#### GET /api/stories/:id
获取小说详情

#### GET /api/stories/:id/chapters
获取小说章节列表

#### GET /api/chapters/:id
获取章节内容

#### GET /api/genres
获取所有分类

### 前端功能

#### 搜索功能
- 实时搜索（debounce 300ms）
- 搜索标题和简介

#### 收藏功能
- 使用 localStorage 存储收藏的小说ID
- 收藏数据格式: `["story_id_1", "story_id_2", ...]`

#### 阅读功能
- 记住阅读进度（localStorage）
- 章节自动翻页（可选）
- 键盘翻页（左右箭头）
- 触摸滑动翻页（移动端）

## 5. 数据库查询

### 获取进行中的小说列表
```sql
SELECT * FROM story_status WHERE is_active = true;
```

### 获取小说章节
```sql
SELECT id, chapter_number, title, word_count, created_at
FROM chapters
WHERE story_id = $1
ORDER BY chapter_number;
```

### 获取章节内容
```sql
SELECT * FROM chapters WHERE id = $1;
```

## 6. 页面路由

- `/` - 首页（小说列表）
- `/search` - 搜索结果页
- `/story/:id` - 小说详情
- `/story/:id/chapter/:chapterId` - 阅读页面
- `/collections` - 收藏页

## 7. 验收标准

- [ ] 首页能正确展示数据库中的小说列表
- [ ] 搜索功能正常工作
- [ ] 收藏功能正常（本地存储）
- [ ] 阅读页面字体清晰、行距舒适
- [ ] 翻页功能正常（点击+键盘）
- [ ] 响应式布局在各尺寸下正常
- [ ] 页面加载无明显卡顿
