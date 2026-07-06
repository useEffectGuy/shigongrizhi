const express = require('express');
const db = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const router = express.Router();

router.get('/info', authMiddleware, (req, res) => {
  const dbPath = path.resolve(process.env.DB_PATH || 'construction.db');
  const stats = {
    users: 0,
    projects: 0,
    logs: 0,
    members: 0,
    devices: 0
  };

  try {
    stats.users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    stats.projects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    stats.logs = db.prepare('SELECT COUNT(*) as count FROM log_entries').get().count;
    stats.members = db.prepare('SELECT COUNT(*) as count FROM project_members').get().count;
    stats.devices = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
  } catch (e) {
    logger.error('Error getting stats:', e);
  }

  res.json({
    databasePath: dbPath,
    dbSize: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0,
    serverTime: new Date().toISOString(),
    stats
  });
});

router.get('/export', adminMiddleware, (req, res) => {
  try {
    const exportData = {
      version: '1.1.0',
      exportedAt: new Date().toISOString(),
      tables: {}
    };

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    
    tables.forEach(table => {
      const rows = db.prepare(`SELECT * FROM ${table.name}`).all();
      exportData.tables[table.name] = rows;
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const exportName = `shigongrizhi-export-${timestamp}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${exportName}"`);
    
    res.json(exportData);
  } catch (err) {
    logger.error('Export error:', err);
    res.status(500).json({ error: 'Export failed: ' + err.message });
  }
});

router.post('/import', adminMiddleware, (req, res) => {
  try {
    const importData = req.body;

    if (!importData || !importData.tables) {
      return res.status(400).json({ error: 'Invalid import data format' });
    }

    let importedCount = 0;
    const results = {};

    const importTransaction = db.transaction(() => {
      for (const [tableName, rows] of Object.entries(importData.tables)) {
        if (!Array.isArray(rows) || rows.length === 0) continue;

        results[tableName] = 0;
        
        const cols = Object.keys(rows[0]);
        const placeholders = cols.map(() => '?').join(',');
        
        try {
          const existingCols = db.prepare(`PRAGMA table_info(${tableName})`).all();
          if (existingCols.length === 0) continue;
        } catch (e) {
          continue;
        }

        rows.forEach(row => {
          try {
            const values = cols.map(col => {
              const val = row[col];
              if (typeof val === 'object' && val !== null) return JSON.stringify(val);
              return val;
            });
            
            if (tableName === 'users') {
              const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(row.username);
              if (existing) return;
            }
            
            if (tableName === 'projects') {
              const existing = db.prepare('SELECT id FROM projects WHERE name = ?').get(row.name);
              if (existing) return;
            }

            db.prepare(`INSERT OR IGNORE INTO ${tableName} (${cols.join(',')}) VALUES (${placeholders})`)
              .run(...values);
            results[tableName]++;
            importedCount++;
          } catch (e) {
            logger.debug(`Skipped row in ${tableName}:`, e.message);
          }
        });
      }
    });

    importTransaction();
    db.saveDatabase();

    res.json({
      success: true,
      importedCount,
      details: results
    });
  } catch (err) {
    logger.error('Import error:', err);
    res.status(500).json({ error: 'Import failed: ' + err.message });
  }
});

router.post('/reset', adminMiddleware, async (req, res) => {
  const { confirm } = req.body;
  if (confirm !== 'YES_RESET_ALL_DATA') {
    return res.status(400).json({ error: 'Reset confirmation required' });
  }

  try {
    const bcrypt = require('bcryptjs');
    
    db.run('BEGIN TRANSACTION');
    try {
      await db.prepare('DELETE FROM devices').run();
      await db.prepare('DELETE FROM project_members').run();
      await db.prepare('DELETE FROM log_entries').run();
      await db.prepare('DELETE FROM projects').run();
      await db.prepare('DELETE FROM users').run();

      const adminHash = bcrypt.hashSync('Admin@123', 10);
      await db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
        .run('admin', adminHash, 'admin');

      const demoHash = bcrypt.hashSync('Demo@123', 10);
      await db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
        .run('demo', demoHash, 'user');

      db.run('COMMIT');
      await db.saveDatabase();

      res.json({ success: true, message: 'Database has been reset to default state' });
    } catch (err) {
      db.run('ROLLBACK');
      throw err;
    }
  } catch (err) {
    logger.error('Reset error:', err);
    res.status(500).json({ error: 'Reset failed: ' + err.message });
  }
});

module.exports = router;
