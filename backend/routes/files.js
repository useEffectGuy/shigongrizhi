const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { minioClient, BUCKET_NAME } = require('../minio');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.mov'];

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }
  
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: 'File type not allowed' });
  }
  
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
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed: ' + err.message });
  }
});

router.post('/upload-multiple', authMiddleware, upload.array('files', 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }
  
  const results = [];
  
  for (const file of req.files) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      fs.unlinkSync(file.path);
      continue;
    }
    
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
      console.error('Upload error:', err);
    }
  }
  
  res.json({ files: results });
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
    console.error('Download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

router.delete('/:objectKey', authMiddleware, async (req, res) => {
  try {
    const objectKey = decodeURIComponent(req.params.objectKey);
    await minioClient.removeObject(BUCKET_NAME, objectKey);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
