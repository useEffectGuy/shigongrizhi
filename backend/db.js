require('dotenv').config();
const initSqlJs = require('sql.js');
const fs = require('fs').promises;
const fsSync = require('fs');
const bcrypt = require('bcryptjs');
const logger = require('./utils/logger');

const DB_PATH = process.env.DB_PATH || 'construction.db';

let db;
let dbInstance;
let SQL;
let initPromise;
let writeQueue = [];
let isWriting = false;

async function saveDatabase() {
  if (isWriting) {
    return new Promise((resolve) => {
      writeQueue.push(resolve);
    });
  }
  
  isWriting = true;
  
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    await fs.writeFile(DB_PATH, buffer);
    
    const queuedCount = writeQueue.length;
    while (writeQueue.length > 0) {
      const resolve = writeQueue.shift();
      resolve();
    }
    
    if (queuedCount > 0) {
      await saveDatabase();
    }
  } catch (err) {
    logger.error('Failed to save database:', err);
    writeQueue = [];
    throw err;
  } finally {
    isWriting = false;
  }
}

async function init() {
  SQL = await initSqlJs();
  
  if (fsSync.existsSync(DB_PATH)) {
    const fileBuffer = fsSync.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`PRAGMA foreign_keys = ON`);
  db.run(`PRAGMA journal_mode = WAL`);
  db.run(`PRAGMA synchronous = NORMAL`);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      device_id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      device_name TEXT,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      creator_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS project_members (
      project_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (project_id, user_id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS log_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      weather TEXT,
      temperature REAL,
      image_keys TEXT DEFAULT '[]',
      workers TEXT DEFAULT '[]',
      materials TEXT DEFAULT '[]',
      equipment TEXT DEFAULT '[]',
      deleted_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    )
  `);
  
  const userCols = db.exec(`PRAGMA table_info(users)`);
  if (userCols.length > 0) {
    const colNames = userCols[0].values.map(c => c[1]);
    if (!colNames.includes('role')) {
      db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
    }
  }
  
  const existingCols = db.exec(`PRAGMA table_info(log_entries)`);
  if (existingCols.length > 0) {
    const colNames = existingCols[0].values.map(c => c[1]);
    if (!colNames.includes('workers')) {
      db.run(`ALTER TABLE log_entries ADD COLUMN workers TEXT DEFAULT '[]'`);
    }
    if (!colNames.includes('materials')) {
      db.run(`ALTER TABLE log_entries ADD COLUMN materials TEXT DEFAULT '[]'`);
    }
    if (!colNames.includes('equipment')) {
      db.run(`ALTER TABLE log_entries ADD COLUMN equipment TEXT DEFAULT '[]'`);
    }
    if (!colNames.includes('deleted_at')) {
      db.run(`ALTER TABLE log_entries ADD COLUMN deleted_at DATETIME`);
    }
  }
  
  const adminUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  if (!adminUser) {
    const adminHash = bcrypt.hashSync('Admin@123', 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run('admin', adminHash, 'admin');
    logger.info('Default admin account created: admin / Admin@123');
  }
  
  await saveDatabase();
  
  dbInstance = {
    prepare(sql) {
      return {
        async run(...params) {
          const stmt = db.prepare(sql);
          try {
            stmt.bind(params);
            stmt.step();
            stmt.free();
            await saveDatabase();
            const result = db.exec('SELECT last_insert_rowid() as id, changes() as changes');
            return {
              changes: result[0]?.values[0][1] || 0,
              lastInsertRowid: result[0]?.values[0][0]
            };
          } catch (err) {
            stmt.free();
            throw err;
          }
        },
        get(...params) {
          const stmt = db.prepare(sql);
          try {
            stmt.bind(params);
            if (stmt.step()) {
              const row = stmt.getAsObject();
              stmt.free();
              return row;
            }
            stmt.free();
            return undefined;
          } catch (err) {
            stmt.free();
            throw err;
          }
        },
        all(...params) {
          const stmt = db.prepare(sql);
          try {
            stmt.bind(params);
            const rows = [];
            while (stmt.step()) {
              rows.push(stmt.getAsObject());
            }
            stmt.free();
            return rows;
          } catch (err) {
            stmt.free();
            throw err;
          }
        }
      };
    },
    async exec(sql) {
      db.run(sql);
      await saveDatabase();
    },
    async transaction(fn) {
      return async function(...args) {
        db.run('BEGIN TRANSACTION');
        try {
          const result = await fn(...args);
          db.run('COMMIT');
          await saveDatabase();
          return result;
        } catch (err) {
          db.run('ROLLBACK');
          throw err;
        }
      };
    }
  };
  
  return dbInstance;
}

initPromise = init();

const dbModule = {
  prepare(sql) {
    if (!dbInstance) {
      throw new Error('Database not initialized yet');
    }
    return dbInstance.prepare(sql);
  },
  exec(sql) {
    if (!dbInstance) {
      throw new Error('Database not initialized yet');
    }
    return dbInstance.exec(sql);
  },
  transaction(fn) {
    if (!dbInstance) {
      throw new Error('Database not initialized yet');
    }
    return dbInstance.transaction(fn);
  },
  initPromise,
  saveDatabase
};

module.exports = dbModule;
