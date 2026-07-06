const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { minioClient, BUCKET_NAME } = require('../minio');
const logger = require('../utils/logger');
const router = express.Router();

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10485760;
const MAX_FILES_PER_REQUEST = parseInt(process.env.MAX_FILES_PER_REQUEST) || 10;

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.mov'];
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'video/mp4', 'video/quicktime'
];

function validateFile(file) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File extension ${ext} not allowed` };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { valid: false, error: `MIME type ${file.mimetype} not allowed` };
  }
  return { valid: true };
}

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES_PER_REQUEST
  },
  fileFilter: (req, file, cb) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      return cb(new Error(validation.error));
    }
    cb(null, true);
  }
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File size exceeds limit',
        message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        maxSize: MAX_FILE_SIZE
      });
    }
    return res.status(400).json({ error: 'Upload error: ' + err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }
  
  const validation = validateFile(req.file);
  if (!validation.valid) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ error: validation.error });
  }
  
  const ext = path.extname(req.file.originalname).toLowerCase();
  
  try {
    const objectKey = `logs/${uuidv4()}${ext}`;
    await minioClient.fPutObject(BUCKET_NAME, objectKey, req.file.path, {
      'Content-Type': req.file.mimetype,
      'X-Amz-Meta-Uploaded-By': req.user.user_id.toString(),
    });
    
    fs.unlinkSync(req.file.path);
    
    res.json({ 
      key: objectKey, 
      url: `/api/files/${encodeURIComponent(objectKey)}`,
      original_name: req.file.originalname,
      size: req.file.size,
      mime_type: req.file.mimetype
    });
  } catch (err) {
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    logger.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

router.post('/upload-multiple', authMiddleware, upload.array('files', MAX_FILES_PER_REQUEST), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }
  
  const results = [];
  const errors = [];
  
  for (const file of req.files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      errors.push({
        original_name: file.originalname,
        error: validation.error
      });
      continue;
    }
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    try {
      const objectKey = `logs/${uuidv4()}${ext}`;
      await minioClient.fPutObject(BUCKET_NAME, objectKey, file.path, {
        'Content-Type': file.mimetype,
        'X-Amz-Meta-Uploaded-By': req.user.user_id.toString(),
      });
      
      fs.unlinkSync(file.path);
      results.push({
        key: objectKey,
        url: `/api/files/${encodeURIComponent(objectKey)}`,
        original_name: file.originalname,
        size: file.size,
        mime_type: file.mimetype
      });
    } catch (err) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      logger.error('Upload error:', err);
      errors.push({
        original_name: file.originalname,
        error: 'Upload failed: ' + err.message
      });
    }
  }
  
  res.json({ files: results, errors });
});

router.get('/:objectKey', async (req, res) => {
  try {
    const objectKey = decodeURIComponent(req.params.objectKey);
    const stat = await minioClient.statObject(BUCKET_NAME, objectKey);
    
    res.setHeader('Content-Type', stat.metaData['content-type'] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    const stream = await minioClient.getObject(BUCKET_NAME, objectKey);
    stream.pipe(res);
  } catch (err) {
    if (err.code === 'NoSuchKey' || err.statusCode === 404) {
      return res.status(404).json({ error: 'File not found' });
    }
    logger.error('Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.delete('/:objectKey', authMiddleware, async (req, res) => {
  try {
    const objectKey = decodeURIComponent(req.params.objectKey);
    await minioClient.removeObject(BUCKET_NAME, objectKey);
    res.json({ success: true });
  } catch (err) {
    logger.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
