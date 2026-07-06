const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const router = express.Router();

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  const hash = bcrypt.hashSync(password, 10);
  try {
    const stmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
    const result = await stmt.run(username, hash);
    res.json({ success: true, user_id: result.lastInsertRowid, username });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password, device_name } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const deviceId = uuidv4();
  await db.prepare('INSERT INTO devices (device_id, user_id, device_name) VALUES (?, ?, ?)')
    .run(deviceId, user.id, device_name || 'unknown');

  const token = jwt.sign(
    { user_id: user.id, username: user.username, device_id: deviceId, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  );
  res.json({
    token,
    user_id: user.id,
    username: user.username,
    role: user.role || 'user',
    device_id: deviceId
  });
});

router.post('/logout', authMiddleware, async (req, res) => {
  const { device_id } = req.user;
  await db.prepare('DELETE FROM devices WHERE device_id = ?').run(device_id);
  res.json({ success: true });
});

router.get('/devices', authMiddleware, (req, res) => {
  const devices = db.prepare(`
    SELECT device_id, device_name, last_active 
    FROM devices WHERE user_id = ? ORDER BY last_active DESC
  `).all(req.user.user_id);
  res.json(devices);
});

router.delete('/devices/:deviceId', authMiddleware, async (req, res) => {
  const result = await db.prepare('DELETE FROM devices WHERE device_id = ? AND user_id = ?')
    .run(req.params.deviceId, req.user.user_id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Device not found' });
  }
  res.json({ success: true });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?')
    .get(req.user.user_id);
  res.json(user);
});

module.exports = router;
