# 施工日志系统

基于 Node.js + Express + SQLite + JWT + WebSocket 实现的施工日志管理系统，支持多账号、多设备共同管理与实时同步。

## 项目结构

```
shigongrizhi/
├── backend/           # Node.js 后端服务（独立模块）
│   ├── middleware/    # 认证中间件
│   ├── routes/        # API 路由
│   ├── db.js          # 数据库初始化
│   ├── minio.js       # 对象存储
│   ├── package.json
│   └── server.js      # 服务入口
│
├── mobile-app/        # Taro 安卓前端（独立模块）
│   ├── src/
│   │   ├── pages/     # 所有页面
│   │   ├── components/
│   │   ├── services/  # API 服务
│   │   ├── styles/
│   │   └── ...
│   └── package.json
│
└── web/               # 电脑前端（独立模块）
    ├── public/
    │   └── desktop.html  # Windows 11 风格界面
    ├── package.json
    └── server.js
```

## 功能特性

### 核心功能
- 🔐 JWT 身份认证
- 📝 施工日志 CRUD（创建、读取、更新、删除）
- 📷 现场照片上传和预览
- 👷 施工人员管理（工种 + 数量）
- 🧱 材料使用记录
- 🚜 机械设备管理
- 📊 数据统计分析
- 🔄 WebSocket 实时同步
- 🌤️ 自动获取当地天气

### 界面风格
- Windows 11 风格设计
- 圆角矩形元素
- 毛玻璃效果
- 居中任务栏
- 简洁扁平化图标
- 深色/浅色主题切换

## 快速开始

### 1. 后端服务

进入后端目录并安装依赖：

```bash
cd backend
npm install
```

启动后端服务：

```bash
node server.js
```

服务地址：`http://localhost:8519`

**访问电脑端界面**：`http://localhost:8519/desktop.html`

**健康检查**：`http://localhost:8519/api/health`

### 2. 电脑前端

电脑端界面已由后端服务提供，访问 `http://localhost:8519/desktop.html` 即可。

**登录信息**：
- 用户名：demo
- 密码：123456

### 3. 安卓前端（Taro）

进入安卓端目录并安装依赖：

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

## API 接口

### 认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 项目
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

### 日志
- `GET /api/projects/:id/logs` - 获取日志列表
- `POST /api/projects/:id/logs` - 创建日志
- `PUT /api/logs/:id` - 更新日志
- `DELETE /api/logs/:id` - 删除日志
- `GET /api/projects/:id/stats/summary` - 获取统计数据

### 文件
- `POST /api/files/upload` - 上传文件
- `GET /api/files/:key` - 下载文件

## 技术栈

### 后端
- Node.js + Express
- SQLite（sql.js）
- JWT 认证
- Socket.io（WebSocket）
- MinIO（对象存储）

### 安卓前端
- Taro 框架
- React + TypeScript
- SCSS 样式

### 电脑前端
- 原生 HTML/CSS/JavaScript
- Windows 11 设计风格
- 动态数据渲染

## 使用说明

### 电脑端操作流程

1. **登录**：输入用户名和密码（demo / 123456）
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

### 统计功能

- **人员统计**：按工种统计总人次
- **材料统计**：按材料名称统计总用量
- **机械统计**：按机械名称统计总台数

## 注意事项

1. **地理位置权限**：自动获取天气功能需要浏览器允许访问位置
2. **网络连接**：天气 API 需要联网访问
3. **端口占用**：确保 8519 端口未被占用
4. **MinIO 可选**：对象存储功能为可选，不影响其他功能

## License

MIT
