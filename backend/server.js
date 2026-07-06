require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const logger = require('./utils/logger');
const db = require('./db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const projectRoutes = require('./routes/projects');
const logRoutes = require('./routes/logs');
const fileRoutes = require('./routes/files');
const { verifySocketToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

async function migrateDefaultPasswords() {
  const defaultAccounts = [
    { username: 'admin', oldPassword: 'admin123', newPassword: 'Admin@123', role: 'admin' },
    { username: 'demo', oldPassword: '123456', newPassword: 'Demo@123', role: 'user' }
  ];
  
  let migratedCount = 0;
  
  for (const account of defaultAccounts) {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(account.username);
    if (user && bcrypt.compareSync(account.oldPassword, user.password_hash)) {
      const newHash = bcrypt.hashSync(account.newPassword, 10);
      await db.prepare('UPDATE users SET password_hash = ? WHERE username = ?')
        .run(newHash, account.username);
      logger.info(`Password migrated for ${account.username}: ${account.oldPassword} -> ${account.newPassword}`);
      migratedCount++;
    }
  }
  
  return migratedCount;
}

async function main() {
  try {
    await db.initPromise;
    
    const migratedCount = await migrateDefaultPasswords();
    
    const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
    if (!adminUser) {
      const adminHash = bcrypt.hashSync('Admin@123', 10);
      db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
        .run('admin', adminHash, 'admin');
      logger.info('Default admin account created: admin / Admin@123');
    }
    
    const demoUser = db.prepare('SELECT * FROM users WHERE username = ?').get('demo');
    if (!demoUser) {
      const demoHash = bcrypt.hashSync('Demo@123', 10);
      db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
        .run('demo', demoHash, 'user');
      logger.info('Demo user created: demo / Demo@123');
    }
    
    if (migratedCount > 0) {
      logger.warn(`${migratedCount} default account(s) password migrated to new policy`);
    }
    
    db.saveDatabase();
    
    startServer();
  } catch (err) {
    logger.error('Database initialization failed:', err);
    process.exit(1);
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const publicDir = path.join(__dirname, '..', 'web', 'public');
app.use(express.static(publicDir));

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/files', fileRoutes);

app.set('io', io);

io.on('connection', (socket) => {
  logger.debug('Client connected:', socket.id);
  socket.user = null;
  socket.joinedProjects = new Set();

  socket.on('authenticate', (token) => {
    const user = verifySocketToken(token);
    if (user) {
      socket.user = user;
      logger.debug(`Socket ${socket.id} authenticated as user ${user.user_id}`);
      socket.emit('authenticated', { success: true, user });
    } else {
      socket.emit('authenticated', { success: false, error: 'Invalid token' });
    }
  });

  socket.on('join_project', (projectId) => {
    if (!socket.user) {
      return socket.emit('error', { error: 'Not authenticated' });
    }
    
    const member = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(projectId, socket.user.user_id);
    
    if (!member) {
      return socket.emit('error', { error: 'Not a member of this project' });
    }
    
    const room = `project_${projectId}`;
    socket.join(room);
    socket.joinedProjects.add(projectId);
    logger.debug(`Socket ${socket.id} joined project ${projectId}`);
    socket.emit('joined', { project_id: parseInt(projectId) });
  });

  socket.on('leave_project', (projectId) => {
    const room = `project_${projectId}`;
    socket.leave(room);
    socket.joinedProjects.delete(projectId);
    logger.debug(`Socket ${socket.id} left project ${projectId}`);
    socket.emit('left', { project_id: parseInt(projectId) });
  });

  socket.on('ping', () => {
    socket.emit('pong', { server_time: new Date().toISOString() });
  });

  socket.on('disconnect', () => {
    logger.debug('Client disconnected:', socket.id);
    socket.joinedProjects.clear();
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
});

app.use(errorHandler);

function startServer() {
  const PORT = parseInt(process.env.PORT) || 8519;
  server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║     施工日志系统 - Construction Log System               ║
╠═══════════════════════════════════════════════════════════╣
║  服务地址: http://localhost:${PORT}                           ║
║  健康检查: http://localhost:${PORT}/api/health               ║
╠═══════════════════════════════════════════════════════════╣
║  技术栈: Node.js + Express + SQLite + MinIO + JWT + WS   ║
║  特性: 多账号、多设备、实时同步、增量同步                  ║
╚═══════════════════════════════════════════════════════════╝
`);
  });
}

main();
