require('dotenv').config();
const Minio = require('minio');
const logger = require('./utils/logger');

// Security: Validate MinIO credentials in production
const isProduction = process.env.NODE_ENV === 'production';
const accessKey = process.env.MINIO_ACCESS_KEY;
const secretKey = process.env.MINIO_SECRET_KEY;

if (isProduction && (!accessKey || !secretKey)) {
  throw new Error('MINIO_ACCESS_KEY and MINIO_SECRET_KEY must be set in production environment');
}

if (!accessKey || !secretKey) {
  logger.warn('Using default MinIO credentials (minioadmin/minioadmin). This is not recommended for production. Please set MINIO_ACCESS_KEY and MINIO_SECRET_KEY environment variables.');
}

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: accessKey || 'minioadmin',
  secretKey: secretKey || 'minioadmin'
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'construction-log-images';

(async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      logger.info(`Bucket ${BUCKET_NAME} created`);
    } else {
      logger.info(`Bucket ${BUCKET_NAME} already exists`);
    }
  } catch (err) {
    logger.warn('MinIO connection failed, file uploads will not work:', err.message);
  }
})();

module.exports = { minioClient, BUCKET_NAME };
