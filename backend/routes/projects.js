const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { sanitizeName, MAX_NAME_LENGTH } = require('../utils/sanitizer');
const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const projects = db.prepare(`
    SELECT p.id, p.name, p.creator_id, p.created_at, pm.role,
      (SELECT COUNT(*) FROM log_entries le WHERE le.project_id = p.id) as log_count
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ?
    ORDER BY p.created_at DESC
  `).all(req.user.user_id);
  res.json(projects);
});

router.get('/:projectId', authMiddleware, (req, res) => {
  const project = db.prepare(`
    SELECT p.*, pm.role
    FROM projects p
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = ? AND pm.user_id = ?
  `).get(req.params.projectId, req.user.user_id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found or access denied' });
  }
  
  const members = db.prepare(`
    SELECT u.id, u.username, pm.role, pm.joined_at
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY pm.role DESC, pm.joined_at
  `).all(req.params.projectId);
  
  res.json({ ...project, members });
});

router.post('/', authMiddleware, async (req, res) => {
  let { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  name = sanitizeName(name);
  if (name.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: `Project name must be less than ${MAX_NAME_LENGTH} characters` });
  }
  
  const existing = db.prepare('SELECT id FROM projects WHERE name = ? AND creator_id = ?')
    .get(name, req.user.user_id);
  if (existing) {
    return res.status(400).json({ error: 'Project name already exists' });
  }
  
  const stmt = db.prepare('INSERT INTO projects (name, creator_id) VALUES (?, ?)');
  const result = await stmt.run(name, req.user.user_id);
  await db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)')
    .run(result.lastInsertRowid, req.user.user_id, 'admin');
  
  const project = db.prepare(`
    SELECT p.*, 'admin' as role 
    FROM projects p WHERE id = ?
  `).get(result.lastInsertRowid);
  
  res.json(project);
});

router.put('/:projectId', authMiddleware, async (req, res) => {
  let { name } = req.body;
  const project = db.prepare(`
    SELECT p.*, pm.role 
    FROM projects p 
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = ? AND pm.user_id = ?
  `).get(req.params.projectId, req.user.user_id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can edit project' });
  }
  
  name = sanitizeName(name);
  if (name.length > MAX_NAME_LENGTH) {
    return res.status(400).json({ error: `Project name must be less than ${MAX_NAME_LENGTH} characters` });
  }
  
  await db.prepare('UPDATE projects SET name = ? WHERE id = ?').run(name, req.params.projectId);
  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.projectId);
  res.json(updated);
});

router.delete('/:projectId', authMiddleware, async (req, res) => {
  const project = db.prepare(`
    SELECT p.*, pm.role 
    FROM projects p 
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = ? AND pm.user_id = ?
  `).get(req.params.projectId, req.user.user_id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can delete project' });
  }
  
  await db.prepare('DELETE FROM project_members WHERE project_id = ?').run(req.params.projectId);
  await db.prepare('DELETE FROM log_entries WHERE project_id = ?').run(req.params.projectId);
  await db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.projectId);
  
  res.json({ success: true });
});

router.post('/:projectId/members', authMiddleware, async (req, res) => {
  const { username } = req.body;
  const project = db.prepare(`
    SELECT p.*, pm.role 
    FROM projects p 
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = ? AND pm.user_id = ?
  `).get(req.params.projectId, req.user.user_id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  if (project.role !== 'admin') {
    return res.status(403).json({ error: 'Only admin can add members' });
  }
  
  const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const existing = db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(req.params.projectId, user.id);
  if (existing) {
    return res.status(400).json({ error: 'User already in project' });
  }
  
  await db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)')
    .run(req.params.projectId, user.id, 'member');
  
  const member = db.prepare(`
    SELECT u.id, u.username, pm.role, pm.joined_at
    FROM project_members pm
    JOIN users u ON pm.user_id = u.id
    WHERE pm.project_id = ? AND pm.user_id = ?
  `).get(req.params.projectId, user.id);
  
  res.json(member);
});

router.delete('/:projectId/members/:userId', authMiddleware, async (req, res) => {
  const project = db.prepare(`
    SELECT p.*, pm.role 
    FROM projects p 
    JOIN project_members pm ON p.id = pm.project_id
    WHERE p.id = ? AND pm.user_id = ?
  `).get(req.params.projectId, req.user.user_id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  const targetUserId = parseInt(req.params.userId);
  if (project.role !== 'admin' && targetUserId !== req.user.user_id) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  if (project.role === 'admin' && targetUserId === req.user.user_id) {
    const memberCount = db.prepare('SELECT COUNT(*) as count FROM project_members WHERE project_id = ?')
      .get(req.params.projectId).count;
    if (memberCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove last member. Delete the project instead.' });
    }
  }
  
  await db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?')
    .run(req.params.projectId, targetUserId);
  
  res.json({ success: true });
});

module.exports = router;
