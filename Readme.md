# 🎓 校园信息共享平台 (CampusInfo Share)

## 1. 项目概述
本项目打造一个高价值的校园综合门户平台，**立足于消除大学生之间的"信息差"**，打破校园资源壁垒。整合升学资讯、竞赛组队、职业发展、技能提升及高质量论坛五大核心板块，为在校大学生提供一站式、可检索的成长资源库，并内置 AI 校园助手。

## 2. 技术栈架构
- **前端:** Vue 3 (Composition API) + Element Plus + Vue Router + Pinia（状态管理）
- **后端:** Node.js + Express.js + MySQL 8.0 + JWT（身份认证）+ AES-256-GCM（配置加密）
- **AI 集成:** DeepSeek API（SSE 流式输出 + RAG 检索增强）
- **版本控制:** Git + GitHub Actions（自动部署）
- **工具链:** VS Code, Postman, Navicat Premium Lite

## 3. 核心功能模块

### 3.1 📚 升学考公 (Study)
- 考研、考公、四六级等分类资料浏览与下载。
- 支持分类筛选、关键词搜索、分页浏览、收藏。

### 3.2 💻 个人提升 (Skills)
- 编程开发、创意设计、办公效率三类学习资源。
- 响应式网格卡片布局，支持筛选、搜索、分页、收藏。

### 3.3 🏆 竞赛组队 (Competition)
- 赛事招募信息发布与浏览，显示"招募中 / 已满员"状态。
- 支持按状态筛选、分页、收藏，发布限流防刷。

### 3.4 💼 实习就业 (Career)
- 校招内推、实习机会、面试经验三分类。
- 普通用户可分享面经，管理员可发布完整招聘信息。
- 支持搜索公司/岗位、分页、收藏、查看投递方式。

### 3.5 💬 校园论坛 (Forum)
- 多板块发帖、分类检索、分页浏览。
- 支持评论、点赞（乐观更新）、收藏、匿名发帖。
- 私有消息系统：帖子作者私信直达。

### 3.6 👤 个人中心 (Profile)
- 聚合面板：我的发布 / 我的收藏 / 个人资料 / 私信。
- 修改昵称、头像、密码；数据统计面板。

### 3.7 📢 公告系统 (Announcements)
- 顶栏铃铛通知入口，红点未读计数。
- 管理员后台发布/编辑/置顶/删除公告。
- 逐条已读追踪 + 一键全部已读。

### 3.8 🤖 AI 校园助手 (AI Chat)
- 悬浮对话面板，SSE 流式输出。
- RAG 检索增强：实时查询平台真实资源辅助回答。
- 管理员可配置 Provider / API Key / 模型 / 提示词。
- 问答频率限制、输入长度校验。

### 3.9 🛡️ 管理员后台 (Admin)
- 数据仪表盘（用户趋势、内容统计、操作日志）。
- 用户管理（封禁/解封、重置密码、创建管理员）。
- 内容发布（升学资料、个人提升、就业信息、公告）。
- 帖子管理、找回密码请求处理。
- AI 配置面板（Provider / Key / Model / 提示词，Key 加密存储）。

### 3.10 ✉️ 私有消息 (Messages)
- 一对一私信会话，实时轮询。
- 未读计数、会话列表、消息收发。
- 通过帖子作者一键发起私信。

## 4. 架构演进

- **V1.0:** 基础论坛 demo，登录注册 + 简单发帖。
- **V2.0:** 主页"金刚区"导航，确立门户化方向。
- **V3.0:** 组件化解耦（NavBar），各模块独立发布。
- **V4.0:** 公告系统、私信系统、AI 助手接入。
- **V5.0（当前）:**  
  - **状态管理:** Pinia 集中管理认证态，消除散落的 localStorage 读写。
  - **逻辑复用:** `usePagination` / `useFavorites` composables + `PaginationBar` 组件，5 个视图统一复用。
  - **设计系统:** CSS 变量 + 工具类 + 全局卡片样式，风格统一。
  - **安全加固:** 数据库 API Key AES-256-GCM 加密，登录限流防爆破，防用户枚举，文件上传 Magic Bytes 校验。
  - **AI 防幻觉:** 强化系统提示词 + RAG 独立消息注入，杜绝编造不存在的资源。

## 5. 开发里程碑

- [x] **Phase 1:** 需求构思与数据库设计
- [x] **Phase 2:** 后端基础设施（JWT 鉴权、连接池、自动建表）
- [x] **Phase 3:** 核心 CRUD + 搜索 + 评论 API
- [x] **Phase 4:** 前端五大模块 + 独立论坛页
- [x] **Phase 5:** 图片上传、收藏、删除、点赞、分页
- [x] **Phase 6:** 公告系统、私信系统、AI 助手、管理员后台
- [x] **Phase 7:** Pinia 重构 + composables 抽取 + CSS 统一 + 安全加固
- [ ] **Phase 8:** 答辩准备与论文撰写



## 🚀 快速启动

### 前置条件
- Node.js 18+
- MySQL 8.0+
- Git

### 1. 克隆项目
```bash
git clone https://github.com/yzzzzzzy/campus-frontend.git
cd campus-frontend
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env`，填写以下必填项：

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的数据库密码
DB_NAME=campus_info_db
JWT_SECRET=你的随机密钥（至少32位）
```

### 3. 准备数据库
在 MySQL 中创建空数据库：
```sql
CREATE DATABASE campus_info_db DEFAULT CHARSET utf8mb4;
```
**无需手动导入 SQL 文件。** 后端首次启动时会自动创建所有表结构（`conversations`、`messages`、`announcements`、`system_config` 等），并写入示例公告数据。

### 4. 安装依赖
```bash
# 后端
npm install

# 前端
cd campus-frontend
npm install
cd ..
```

### 5. 一键启动
```bash
npm run start:all
```

### 6. 访问系统

| 服务     | 地址                    |
| -------- | ----------------------- |
| 前台页面 | `http://localhost:5173` |
| 后端 API | `http://localhost:3000` |

### 7. 配置 AI 助手（可选）
1. 在 [DeepSeek 开放平台](https://platform.deepseek.com) 申请 API Key。
2. 登录系统 → 管理员后台 → AI 配置。
3. 粘贴 API Key，保存后 AI 助手即时生效。

---

*最后更新时间：2026-05*