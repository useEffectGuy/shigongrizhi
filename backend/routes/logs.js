const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

function getProjectMember(projectId, userId) {
  return db.prepare('SELECT * FROM project_members WHERE project_id = ? AND user_id = ?')
    .get(projectId, userId);
}

router.post('/:projectId', authMiddleware, async (req, res) => {
  const { projectId } = req.params;
  const { content, weather, temperature, imageKeys, workers, materials, equipment } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Log content is required' });
  }
  
  const member = getProjectMember(projectId, req.user.user_id);
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO log_entries (project_id, author_id, content, weather, temperature, image_keys, workers, materials, equipment, updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `);
  const result = await stmt.run(projectId, req.user.user_id, content, weather || null, 
    temperature || null, JSON.stringify(imageKeys || []), 
    JSON.stringify(workers || []), JSON.stringify(materials || []), JSON.stringify(equipment || []), now);
  
  const newLog = db.prepare(`
    SELECT le.*, u.username as author_name
    FROM log_entries le
    JOIN users u ON le.author_id = u.id
    WHERE le.id = ?
  `).get(result.lastInsertRowid);
  newLog.image_keys = JSON.parse(newLog.image_keys);
  newLog.workers = JSON.parse(newLog.workers || '[]');
  newLog.materials = JSON.parse(newLog.materials || '[]');
  newLog.equipment = JSON.parse(newLog.equipment || '[]');
  
  const io = req.app.get('io');
  io.to(`project_${projectId}`).emit('log_created', newLog);
  res.json(newLog);
});

router.put('/:projectId/:logId', authMiddleware, async (req, res) => {
  const { projectId, logId } = req.params;
  const { content, weather, temperature, imageKeys, workers, materials, equipment } = req.body;
  
  const member = getProjectMember(projectId, req.user.user_id);
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });
  
  const log = db.prepare('SELECT * FROM log_entries WHERE id = ? AND project_id = ?').get(logId, projectId);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  
  if (log.author_id !== req.user.user_id && member.role !== 'admin') {
    return res.status(403).json({ error: 'Can only edit your own logs or as admin' });
  }

  const now = new Date().toISOString();
  const existingWorkers = JSON.parse(log.workers || '[]');
  const existingMaterials = JSON.parse(log.materials || '[]');
  const existingEquipment = JSON.parse(log.equipment || '[]');
  await db.prepare(`
    UPDATE log_entries SET content=?, weather=?, temperature=?, image_keys=?, workers=?, materials=?, equipment=?, updated_at=? 
    WHERE id=?
  `).run(content || log.content, weather !== undefined ? weather : log.weather, 
    temperature !== undefined ? temperature : log.temperature, 
    JSON.stringify(imageKeys !== undefined ? imageKeys : JSON.parse(log.image_keys)), 
    JSON.stringify(workers !== undefined ? workers : existingWorkers),
    JSON.stringify(materials !== undefined ? materials : existingMaterials),
    JSON.stringify(equipment !== undefined ? equipment : existingEquipment),
    now, logId);
  
  const updated = db.prepare(`
    SELECT le.*, u.username as author_name
    FROM log_entries le
    JOIN users u ON le.author_id = u.id
    WHERE le.id = ?
  `).get(logId);
  updated.image_keys = JSON.parse(updated.image_keys);
  updated.workers = JSON.parse(updated.workers || '[]');
  updated.materials = JSON.parse(updated.materials || '[]');
  updated.equipment = JSON.parse(updated.equipment || '[]');
  
  const io = req.app.get('io');
  io.to(`project_${projectId}`).emit('log_updated', updated);
  res.json(updated);
});

router.delete('/:projectId/:logId', authMiddleware, async (req, res) => {
  const { projectId, logId } = req.params;
  
  const member = getProjectMember(projectId, req.user.user_id);
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });
  
  const log = db.prepare('SELECT * FROM log_entries WHERE id = ? AND project_id = ?').get(logId, projectId);
  if (!log) return res.status(404).json({ error: 'Log not found' });
  
  if (log.author_id !== req.user.user_id && member.role !== 'admin') {
    return res.status(403).json({ error: 'Can only delete your own logs or as admin' });
  }
  
  await db.prepare('DELETE FROM log_entries WHERE id = ?').run(logId);
  
  const io = req.app.get('io');
  io.to(`project_${projectId}`).emit('log_deleted', { id: parseInt(logId), project_id: parseInt(projectId) });
  res.json({ success: true, id: parseInt(logId) });
});

router.get('/sync/:projectId', authMiddleware, (req, res) => {
  const { projectId } = req.params;
  const { lastSync } = req.query;
  
  const member = getProjectMember(projectId, req.user.user_id);
  if (!member) return res.status(403).json({ error: 'Forbidden' });
  
  let logs;
  if (lastSync) {
    logs = db.prepare(`
      SELECT le.*, u.username as author_name
      FROM log_entries le
      JOIN users u ON le.author_id = u.id
      WHERE le.project_id = ? AND le.updated_at > ?
      ORDER BY le.updated_at
    `).all(projectId, lastSync);
  } else {
    logs = db.prepare(`
      SELECT le.*, u.username as author_name
      FROM log_entries le
      JOIN users u ON le.author_id = u.id
      WHERE le.project_id = ?
      ORDER BY le.updated_at
    `).all(projectId);
  }
  
  logs = logs.map(log => ({ 
    ...log, 
    image_keys: JSON.parse(log.image_keys),
    workers: JSON.parse(log.workers || '[]'),
    materials: JSON.parse(log.materials || '[]'),
    equipment: JSON.parse(log.equipment || '[]')
  }));
  res.json({ logs, server_time: new Date().toISOString() });
});

router.get('/:projectId/:logId', authMiddleware, (req, res) => {
  const { projectId, logId } = req.params;
  
  const member = getProjectMember(projectId, req.user.user_id);
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });
  
  const log = db.prepare(`
    SELECT le.*, u.username as author_name
    FROM log_entries le
    JOIN users u ON le.author_id = u.id
    WHERE le.id = ? AND le.project_id = ?
  `).get(logId, projectId);
  
  if (!log) return res.status(404).json({ error: 'Log not found' });
  log.image_keys = JSON.parse(log.image_keys);
  log.workers = JSON.parse(log.workers || '[]');
  log.materials = JSON.parse(log.materials || '[]');
  log.equipment = JSON.parse(log.equipment || '[]');
  res.json(log);
});

router.get('/:projectId', authMiddleware, (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const member = getProjectMember(projectId, req.user.user_id);
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });
  
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;
  
  const logs = db.prepare(`
    SELECT le.*, u.username as author_name
    FROM log_entries le
    JOIN users u ON le.author_id = u.id
    WHERE le.project_id = ?
    ORDER BY le.created_at DESC
    LIMIT ? OFFSET ?
  `).all(projectId, limitNum, offset);
  
  const total = db.prepare('SELECT COUNT(*) as count FROM log_entries WHERE project_id = ?')
    .get(projectId).count;
  
  logs.forEach(log => {
    log.image_keys = JSON.parse(log.image_keys);
    log.workers = JSON.parse(log.workers || '[]');
    log.materials = JSON.parse(log.materials || '[]');
    log.equipment = JSON.parse(log.equipment || '[]');
  });
  res.json({
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      total_pages: Math.ceil(total / limitNum)
    }
  });
});

router.get('/:projectId/stats/summary', authMiddleware, (req, res) => {
  const { projectId } = req.params;
  
  const member = getProjectMember(projectId, req.user.user_id);
  if (!member) return res.status(403).json({ error: 'Not a member of this project' });
  
  const logs = db.prepare(`
    SELECT workers, materials, equipment
    FROM log_entries
    WHERE project_id = ?
  `).all(projectId);
  
  const workerStats = {};
  const materialStats = {};
  const equipmentStats = {};
  
  logs.forEach(log => {
    const workers = JSON.parse(log.workers || '[]');
    const materials = JSON.parse(log.materials || '[]');
    const equipment = JSON.parse(log.equipment || '[]');
    
    workers.forEach(w => {
      if (!workerStats[w.name]) {
        workerStats[w.name] = { name: w.name, count: 0, log_count: 0 };
      }
      workerStats[w.name].count += parseInt(w.count) || 0;
      workerStats[w.name].log_count += 1;
    });
    
    materials.forEach(m => {
      if (!materialStats[m.name]) {
        materialStats[m.name] = { name: m.name, count: 0, unit: m.unit || '', log_count: 0 };
      }
      materialStats[m.name].count += parseFloat(m.count) || 0;
      materialStats[m.name].log_count += 1;
    });
    
    equipment.forEach(e => {
      if (!equipmentStats[e.name]) {
        equipmentStats[e.name] = { name: e.name, count: 0, unit: e.unit || '', log_count: 0 };
      }
      equipmentStats[e.name].count += parseFloat(e.count) || 0;
      equipmentStats[e.name].log_count += 1;
    });
  });
  
  res.json({
    total_logs: logs.length,
    workers: Object.values(workerStats),
    materials: Object.values(materialStats),
    equipment: Object.values(equipmentStats)
  });
});

module.exports = router;
