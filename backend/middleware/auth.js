require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'construction-log-secret-key-change-in-production';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.prepare('UPDATE devices SET last_active = CURRENT_TIMESTAMP WHERE device_id = ?')
      .run(decoded.device_id);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function verifySocketToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db.prepare('UPDATE devices SET last_active = CURRENT_TIMESTAMP WHERE device_id = ?')
      .run(decoded.device_id);
    return decoded;
  } catch (err) {
    return null;
  }
}

module.exports = { authMiddleware, verifySocketToken, JWT_SECRET };
