require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('\x1b[31m%s\x1b[0m', 'ERROR: JWT_SECRET environment variable must be set and at least 32 characters long');
  process.exit(1);
}

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await db.prepare('UPDATE devices SET last_active = CURRENT_TIMESTAMP WHERE device_id = ?')
      .run(decoded.device_id);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function adminMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await db.prepare('UPDATE devices SET last_active = CURRENT_TIMESTAMP WHERE device_id = ?')
      .run(decoded.device_id);
    
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(decoded.user_id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function verifySocketToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    await db.prepare('UPDATE devices SET last_active = CURRENT_TIMESTAMP WHERE device_id = ?')
      .run(decoded.device_id);
    return decoded;
  } catch (err) {
    return null;
  }
}

module.exports = { authMiddleware, adminMiddleware, verifySocketToken, JWT_SECRET };
