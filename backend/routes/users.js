const express = require('express');
const db = require('../db');
const bcrypt = require('bcryptjs');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validatePassword } = require('../utils/validators');
const router = express.Router();

router.get('/', adminMiddleware, (req, res) => {
  const users = db.prepare(`
    SELECT u.id, u.username, u.role, u.created_at,
      (SELECT COUNT(*) FROM project_members pm WHERE pm.user_id = u.id) as project_count
    FROM users u
    ORDER BY u.role DESC, u.created_at DESC
  `).all();
  res.json(users);
});

router.get('/:userId', adminMiddleware, (req, res) => {
  const user = db.prepare(`
    SELECT u.id, u.username, u.role, u.created_at
    FROM users u WHERE u.id = ?
  `).get(req.params.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const projects = db.prepare(`
    SELECT p.id, p.name, p.created_at, pm.role as project_role, pm.joined_at
    FROM project_members pm
    JOIN projects p ON pm.project_id = p.id
    WHERE pm.user_id = ?
  `).all(req.params.userId);
  
  res.json({ ...user, projects });
});

router.delete('/:userId', adminMiddleware, async (req, res) => {
  const targetId = parseInt(req.params.userId);
  
  if (targetId === req.user.user_id) {
    return res.status(400).json({ error: 'Cannot delete yourself' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (user.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin' });
    }
  }
  
  await db.prepare('DELETE FROM project_members WHERE user_id = ?').run(targetId);
  await db.prepare('DELETE FROM devices WHERE user_id = ?').run(targetId);
  await db.prepare('DELETE FROM users WHERE id = ?').run(targetId);
  
  res.json({ success: true });
});

router.put('/:userId/role', adminMiddleware, async (req, res) => {
  const { role } = req.body;
  const targetId = parseInt(req.params.userId);
  
  if (!role || (role !== 'admin' && role !== 'user')) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  if (targetId === req.user.user_id && role !== 'admin') {
    return res.status(400).json({ error: 'Cannot demote yourself' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (role !== 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get().count;
    if (adminCount <= 1 && user.role === 'admin') {
      return res.status(400).json({ error: 'Cannot demote the last admin' });
    }
  }
  
  await db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, targetId);
  const updated = db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(targetId);
  res.json(updated);
});

router.put('/:userId/password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  const targetId = parseInt(req.params.userId);
  
  if (targetId !== req.user.user_id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (req.user.role !== 'admin') {
    if (!current_password || !bcrypt.compareSync(current_password, user.password_hash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
  }
  
  if (!new_password) {
    return res.status(400).json({ error: 'New password is required' });
  }
  
  const passwordError = validatePassword(new_password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }
  
  const hash = bcrypt.hashSync(new_password, 10);
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, targetId);
  res.json({ success: true });
});

module.exports = router;
