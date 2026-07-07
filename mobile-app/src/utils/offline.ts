import Taro from '@tarojs/taro';
import { logger } from './logger';

const STORAGE_PREFIX = 'offline_';
const SYNC_QUEUE_KEY = 'offline_sync_queue';

interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
}

/**
 * Offline data storage utility
 */
class OfflineStorage {
  /**
   * Store data offline with a key
   */
  async set<T>(key: string, data: T): Promise<void> {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      await Taro.setStorageSync(storageKey, {
        data,
        timestamp: Date.now()
      });
      logger.debug('[Offline] Stored data:', key);
    } catch (error: any) {
      logger.error('[Offline] Failed to store data:', error.message);
    }
  }

  /**
   * Get data from offline storage
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      const stored = await Taro.getStorageSync(storageKey);
      if (stored) {
        logger.debug('[Offline] Retrieved data:', key);
        return stored.data as T;
      }
      return null;
    } catch (error: any) {
      logger.error('[Offline] Failed to retrieve data:', error.message);
      return null;
    }
  }

  /**
   * Remove data from offline storage
   */
  async remove(key: string): Promise<void> {
    try {
      const storageKey = `${STORAGE_PREFIX}${key}`;
      await Taro.removeStorageSync(storageKey);
      logger.debug('[Offline] Removed data:', key);
    } catch (error: any) {
      logger.error('[Offline] Failed to remove data:', error.message);
    }
  }

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<void> {
    try {
      const info = await Taro.getStorageInfo();
      // Handle different return types from Taro
      const keys = (info as any).keys || [];
      for (const key of keys) {
        if (key.startsWith(STORAGE_PREFIX)) {
          await Taro.removeStorageSync(key);
        }
      }
      logger.debug('[Offline] Cleared all offline data');
    } catch (error: any) {
      logger.error('[Offline] Failed to clear data:', error.message);
    }
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(item: SyncQueueItem): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue.push(item);
      await Taro.setStorageSync(SYNC_QUEUE_KEY, queue);
      logger.debug('[Offline] Added to sync queue:', item.type, item.endpoint);
    } catch (error: any) {
      logger.error('[Offline] Failed to add to sync queue:', error.message);
    }
  }

  /**
   * Get sync queue
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const queue = await Taro.getStorageSync(SYNC_QUEUE_KEY);
      return queue || [];
    } catch (error: any) {
      logger.error('[Offline] Failed to get sync queue:', error.message);
      return [];
    }
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(itemId: string): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      const filtered = queue.filter(item => item.id !== itemId);
      await Taro.setStorageSync(SYNC_QUEUE_KEY, filtered);
      logger.debug('[Offline] Removed from sync queue:', itemId);
    } catch (error: any) {
      logger.error('[Offline] Failed to remove from sync queue:', error.message);
    }
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    try {
      await Taro.removeStorageSync(SYNC_QUEUE_KEY);
      logger.debug('[Offline] Cleared sync queue');
    } catch (error: any) {
      logger.error('[Offline] Failed to clear sync queue:', error.message);
    }
  }

  /**
   * Check if device is online
   */
  async isOnline(): Promise<boolean> {
    try {
      const networkType = await Taro.getNetworkType();
      return networkType.networkType !== 'none';
    } catch (error) {
      return true; // Assume online if check fails
    }
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorage();

export default offlineStorage;
export type { SyncQueueItem };
