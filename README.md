# 知识库管理系统

一个现代化的网页版知识库系统，支持文档管理、审核流程、权限控制等功能。

## 功能特性

### 1. 用户系统
- 用户注册与登录
- 三种权限角色：管理员、编辑、普通用户
- JWT 认证
- OAuth2 第三方登录支持（可扩展）

### 2. 文档管理
- 支持多种格式：PDF、Word、Markdown
- 文档上传与编辑
- 文档预览与下载

### 3. 审核系统
- 提交-审核-发布流程
- 审核状态追踪
- 审核记录历史

### 4. 分类与搜索
- 文档分类管理
- 标签系统
- 关键词搜索
- 高级筛选

### 5. 界面设计
- 现代化UI设计
- 响应式布局
- 直观的用户体验

## 技术栈

- **前端**: Vue 3 + Vite + Element Plus
- **后端**: Node.js + Express
- **数据库**: MongoDB
- **认证**: JWT
- **容器化**: Docker + Docker Compose

## 快速开始

### 前置要求

- Docker & Docker Compose
- Node.js 18+ (本地开发)
- MongoDB 6+ (本地开发)

### Docker 部署

```bash
# 克隆项目
cd knowledge-base

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

服务启动后：
- 前端: http://localhost:3000
- 后端API: http://localhost:5000
- API文档: http://localhost:5000/api-docs

### 本地开发

#### 后端开发

```bash
cd backend
npm install
npm run dev
```

#### 前端开发

```bash
cd frontend
npm install
npm run dev
```

## 默认账户

系统初始化时会创建默认管理员账户：

- 用户名: `admin@knowledge-base.com`
- 密码: `Admin@123`

**重要**: 首次登录后请立即修改密码！

## 项目结构

```
knowledge-base/
├── frontend/                 # Vue 3 前端
│   ├── src/
│   │   ├── api/             # API 调用
│   │   ├── assets/          # 静态资源
│   │   ├── components/      # 通用组件
│   │   ├── layouts/         # 布局组件
│   │   ├── router/          # 路由配置
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── utils/           # 工具函数
│   │   ├── views/           # 页面组件
│   │   └── App.vue
│   ├── package.json
│   └── vite.config.js
├── backend/                  # Express 后端
│   ├── src/
│   │   ├── config/          # 配置文件
│   │   ├── controllers/     # 控制器
│   │   ├── middlewares/     # 中间件
│   │   ├── models/          # MongoDB 模型
│   │   ├── routes/          # 路由
│   │   ├── services/        # 业务逻辑
│   │   ├── utils/           # 工具函数
│   │   └── app.js
│   ├── uploads/             # 上传文件存储
│   ├── package.json
│   └── swagger.js
├── docker-compose.yml
└── README.md
```

## API 文档

启动后端服务后，访问 http://localhost:5000/api-docs 查看完整的 API 文档。

主要 API 端点：

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/documents` - 获取文档列表
- `POST /api/documents` - 上传文档
- `PUT /api/documents/:id` - 更新文档
- `POST /api/documents/:id/submit` - 提交审核
- `PUT /api/documents/:id/review` - 审核文档
- `GET /api/categories` - 获取分类列表
- `GET /api/documents/search` - 搜索文档

## 使用手册

详细使用手册请参考 [MANUAL.md](./MANUAL.md)

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
