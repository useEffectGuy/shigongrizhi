import Taro from '@tarojs/taro';
import { logger } from './logger';

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compress image before upload
 * @param filePath - Original image file path
 * @param options - Compression options
 * @returns Compressed image file path
 */
export async function compressImage(
  filePath: string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8
  } = options;

  try {
    logger.debug('[Image] Compressing image:', filePath);

    // Get image info
    const info = await Taro.getImageInfo({ src: filePath });
    logger.debug('[Image] Original image size:', info.width, 'x', info.height);

    // Calculate new dimensions
    let { width, height } = info;
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    
    if (ratio < 1) {
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
      logger.debug('[Image] Compressed image size:', width, 'x', height);
    }

    // Compress image
    const compressedResult = await Taro.compressImage({
      src: filePath,
      quality: Math.round(quality * 100),
      compressedWidth: width,
      compressedHeight: height
    });

    const compressedPath = compressedResult.tempFilePath || filePath;
    logger.debug('[Image] Compressed image path:', compressedPath);
    return compressedPath;
  } catch (error: any) {
    logger.error('[Image] Compression failed:', error.message);
    // Return original path if compression fails
    return filePath;
  }
}

/**
 * Get image file size in KB
 * @param filePath - Image file path
 * @returns File size in KB
 */
export async function getImageSize(filePath: string): Promise<number> {
  try {
    // Use FileSystem API to get file size
    const fileInfo = await Taro.getFileInfo({ filePath });
    if (fileInfo && 'size' in fileInfo) {
      return Math.round((fileInfo.size as number) / 1024);
    }
    return 0;
  } catch (error: any) {
    logger.error('[Image] Failed to get image size:', error.message);
    return 0;
  }
}

/**
 * Check if image needs compression
 * @param filePath - Image file path
 * @param maxSizeKB - Maximum size in KB (default: 2MB)
 * @returns Whether image needs compression
 */
export async function needsCompression(
  filePath: string,
  maxSizeKB: number = 2048
): Promise<boolean> {
  const sizeKB = await getImageSize(filePath);
  return sizeKB > maxSizeKB;
}
