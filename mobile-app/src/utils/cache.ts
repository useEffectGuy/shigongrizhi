import { logger } from './logger';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  constructor(defaultTTL?: number) {
    if (defaultTTL) {
      this.defaultTTL = defaultTTL;
    }
  }

  /**
   * Generate cache key from request parameters
   */
  private generateKey(url: string, method: string = 'GET', data?: any): string {
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataStr}`;
  }

  /**
   * Get cached data
   */
  get<T>(url: string, method: string = 'GET', data?: any): T | null {
    const key = this.generateKey(url, method, data);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache is expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      logger.debug('[Cache] Cache expired:', key);
      return null;
    }

    logger.debug('[Cache] Cache hit:', key);
    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(url: string, value: T, method: string = 'GET', ttl?: number, requestData?: any): void {
    const key = this.generateKey(url, method, requestData);
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
    logger.debug('[Cache] Cache set:', key, 'TTL:', entry.ttl);
  }

  /**
   * Clear cache for specific URL pattern
   */
  clear(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          logger.debug('[Cache] Cache cleared for pattern:', pattern);
        }
      }
    } else {
      this.cache.clear();
      logger.debug('[Cache] All cache cleared');
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();
    let clearedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      logger.debug('[Cache] Cleared', clearedCount, 'expired entries');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instance
const cache = new RequestCache();

// Clear expired cache every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.clearExpired();
  }, 5 * 60 * 1000);
}

export default cache;
