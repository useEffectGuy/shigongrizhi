# 施工日志系统

基于 Node.js + Express + SQLite + JWT + WebSocket 实现的施工日志管理系统，支持多账号、多设备共同管理与实时同步。

## 项目结构

```
shigongrizhi/
├── backend/           # Node.js 后端服务（独立模块）
│   ├── middleware/    # 中间件（认证、限流、安全等）
│   ├── routes/        # API 路由
│   ├── utils/         # 工具函数
│   ├── __tests__/     # 单元测试
│   ├── db.js          # 数据库初始化
│   ├── minio.js       # 对象存储
│   ├── Dockerfile     # Docker 配置
│   ├── package.json
│   └── server.js      # 服务入口
│
├── mobile-app/        # Taro 移动端前端（独立模块）
│   ├── src/
│   │   ├── pages/     # 所有页面
│   │   ├── components/
│   │   ├── services/  # API 服务
│   │   ├── utils/     # 工具函数（缓存、离线、图片等）
│   │   └── styles/
│   └── package.json
│
├── web/               # 电脑前端（独立模块）
│   ├── public/
│   │   └── desktop.html  # Windows 11 风格界面
│   └── server.js
│
├── docker-compose.yml # Docker 编排配置
└── .env.example       # 环境变量示例
```

## 功能特性

### 核心功能
- 🔐 JWT 身份认证 + 设备管理
- 📝 施工日志 CRUD（创建、读取、更新、删除）
- 📷 现场照片上传和预览（自动压缩）
- 👷 施工人员管理（工种 + 数量）
- 🧱 材料使用记录
- 🚜 机械设备管理
- 📊 数据统计分析
- 🔄 WebSocket 实时同步
- 🌤️ 自动获取当地天气
- 🗑️ 回收站功能（软删除）
- 📦 离线数据支持
- 💾 请求缓存机制

### 安全特性
- 🔒 CSP 安全响应头
- 🛡️ API 限流保护
- 📝 请求 ID 追踪
- 🔐 MinIO 凭证安全验证
- ⚡ HSTS 支持（生产环境）

### 界面风格
- Windows 11 风格设计
- 圆角矩形元素
- 毛玻璃效果
- 居中任务栏
- 简洁扁平化图标
- 深色/浅色主题切换

## 快速开始

### 1. 使用 Docker（推荐）

确保已安装 Docker 和 Docker Compose，然后运行：

```bash
# 复制环境变量配置
cp .env.example .env

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend
```

服务地址：`http://localhost:8519`

### 2. 本地开发

#### 后端服务

进入后端目录并安装依赖：

```bash
cd backend
npm install
```

配置环境变量（复制 `.env.example` 为 `.env` 并修改）：

```bash
cp .env.example .env
```

启动后端服务：

```bash
npm start
```

或开发模式：

```bash
npm run dev
```

运行测试：

```bash
npm test
npm run test:coverage
```

服务地址：`http://localhost:8519`

**健康检查**：`http://localhost:8519/health`

**访问电脑端界面**：`http://localhost:8519/desktop.html`

#### 移动端（Taro）

进入移动端目录并安装依赖：

```bash
cd mobile-app
npm install
```

开发模式：

```bash
# 微信小程序
npm run dev:weapp

# H5
npm run dev:h5
```

构建生产版本：

```bash
npm run build:weapp
```

## 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# 服务器配置
NODE_ENV=production
PORT=8519

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters
JWT_EXPIRES_IN=30d

# 限流配置
LOGIN_RATE_LIMIT=5
LOGIN_RATE_WINDOW=60000

# MinIO 配置
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET=construction-log-images

# CORS 配置
CORS_ORIGIN=*

# 数据库配置
DB_PATH=construction.db

# 文件上传配置
MAX_FILE_SIZE=10485760
MAX_FILES_PER_REQUEST=10
```

## API 接口

### API 版本控制

当前 API 版本：v1

- 旧版路径 `/api/*` 会自动重定向到 `/api/v1/*`
- 建议直接使用 `/api/v1/*` 路径

### 认证
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `GET /api/v1/auth/me` - 获取当前用户信息
- `GET /api/v1/auth/devices` - 获取设备列表
- `DELETE /api/v1/auth/devices/:deviceId` - 移除设备

### 项目
- `GET /api/v1/projects` - 获取项目列表
- `GET /api/v1/projects/:id` - 获取项目详情
- `POST /api/v1/projects` - 创建项目
- `PUT /api/v1/projects/:id` - 更新项目
- `DELETE /api/v1/projects/:id` - 删除项目
- `POST /api/v1/projects/:id/members` - 添加成员
- `DELETE /api/v1/projects/:id/members/:userId` - 移除成员

### 日志
- `GET /api/v1/logs/:projectId` - 获取日志列表（分页）
- `GET /api/v1/logs/:projectId/:logId` - 获取日志详情
- `POST /api/v1/logs/:projectId` - 创建日志
- `PUT /api/v1/logs/:projectId/:logId` - 更新日志
- `DELETE /api/v1/logs/:projectId/:logId` - 删除日志（软删除）
- `POST /api/v1/logs/:projectId/:logId/restore` - 恢复日志
- `DELETE /api/v1/logs/:projectId/:logId/force` - 永久删除
- `GET /api/v1/logs/:projectId/recycle` - 回收站
- `GET /api/v1/logs/sync/:projectId` - 增量同步
- `GET /api/v1/logs/:projectId/stats/summary` - 获取统计数据

### 文件
- `POST /api/v1/files/upload` - 上传文件
- `POST /api/v1/files/upload/multiple` - 批量上传
- `GET /api/v1/files/:key` - 下载文件
- `DELETE /api/v1/files/:key` - 删除文件

### 系统（管理员）
- `GET /api/v1/settings/info` - 系统信息
- `GET /api/v1/settings/export` - 导出数据
- `POST /api/v1/settings/import` - 导入数据
- `POST /api/v1/settings/reset` - 重置数据库

### 健康检查
- `GET /health` - 健康检查（无需认证）

## 技术栈

### 后端
- Node.js + Express
- SQLite（sql.js）- 优化批量写入
- JWT 认证
- Socket.io（WebSocket）
- MinIO（对象存储）
- express-rate-limit（限流）
- Jest + Supertest（测试）

### 移动端
- Taro 框架
- React + TypeScript
- SCSS 样式
- Zustand（状态管理）
- 请求缓存
- 离线数据支持
- 图片压缩

### 电脑前端
- 原生 HTML/CSS/JavaScript
- Windows 11 设计风格
- 动态数据渲染

## 使用说明

### 电脑端操作流程

1. **登录**：输入用户名和密码
2. **查看日志**：首页显示最近日志列表
3. **筛选日志**：
   - 点击"总日志" → 显示全部日志
   - 点击"本周" → 显示最近 7 天日志
   - 点击"今日" → 显示今天的日志
4. **新建日志**：
   - 点击右下角 "+" 按钮
   - 填写日志内容
   - 可点击"获取当前天气"自动获取当地天气
   - 添加施工人员、材料、机械设备
5. **数据统计**：查看人员、材料、机械统计分析

### 默认账户

**演示账户**：
- 用户名：demo
- 密码：Demo@123

**管理员账户**：
- 用户名：admin
- 密码：Admin@123

### 统计功能

- **人员统计**：按工种统计总人次
- **材料统计**：按材料名称统计总用量
- **机械统计**：按机械名称统计总台数

## 性能优化

### 后端优化
- 数据库批量写入（1秒缓冲）
- API 限流保护
- 请求 ID 追踪
- 健康检查端点

### 移动端优化
- 请求缓存（5分钟 TTL）
- 图片自动压缩（>2MB）
- 离线数据支持
- 生产环境日志禁用

## 安全建议

1. **生产环境必须修改**：
   - JWT_SECRET（至少32字符）
   - MinIO 凭证
   - 数据库密码（如使用外部数据库）

2. **启用 HTTPS**：
   - 设置 `ENABLE_HTTPS=true`
   - 配置 SSL 证书

3. **CORS 配置**：
   - 设置 `CORS_ORIGIN` 为具体域名
   - 不要使用 `*`

## 注意事项

1. **地理位置权限**：自动获取天气功能需要浏览器允许访问位置
2. **网络连接**：天气 API 需要联网访问
3. **端口占用**：确保 8519 端口未被占用
4. **MinIO 可选**：对象存储功能为可选，不影响其他功能
5. **数据库备份**：建议定期备份数据库文件

## License

MIT
