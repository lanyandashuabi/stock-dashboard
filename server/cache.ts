/**
 * 内存缓存层
 * 带 TTL 的简单内存缓存，减少对免费接口的请求频率
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }
    this.hits++;
    return entry.data as T;
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param data 数据
   * @param ttlMs TTL（毫秒），默认 30 秒
   */
  set<T>(key: string, data: T, ttlMs: number = 30000): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * 获取或设置缓存
   * 如果缓存命中且未过期则返回缓存数据，否则执行 fetcher 获取新数据并缓存
   */
  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs: number = 30000): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? (this.hits / (this.hits + this.misses)) * 100 : 0,
    };
  }
}

// 单例
export const cache = new MemoryCache();

// TTL 常量
export const TTL = {
  REALTIME: 30000, // 实时行情 30 秒
  INDEX: 30000, // 指数 30 秒
  KLINE: 3600000, // K线 1 小时
  MACRO: 60000, // 宏观数据 1 分钟
  NORTH_BOUND: 60000, // 北向资金 1 分钟
};
