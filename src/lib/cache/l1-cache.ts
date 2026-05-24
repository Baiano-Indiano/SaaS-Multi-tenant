interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class L1Cache {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Retrieves a value from the cache.
   * Returns undefined if the key is not present or has expired (a cache miss).
   * Returns null if the cached value is explicitly null (a cache hit of null).
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  /**
   * Stores a value in the cache with a specified TTL in milliseconds.
   * Defaults to 5000ms (5 seconds).
   */
  set<T>(key: string, value: T, ttlMs: number = 5000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Evicts/Deletes a key from the cache.
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

// Persist the cache container across HMR/hot-reloads in development
const globalForCache = globalThis as unknown as {
  l1Cache: L1Cache | undefined;
};

export const l1Cache = globalForCache.l1Cache ?? new L1Cache();

if (process.env.NODE_ENV !== "production") {
  globalForCache.l1Cache = l1Cache;
}
