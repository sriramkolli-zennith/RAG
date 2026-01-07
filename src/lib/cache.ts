/**
 * Simple in-memory cache with TTL support
 * For production, consider using Redis
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();

  set(key: string, value: T, ttlSeconds: number = 300) {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton caches
export const embeddingCache = new Cache<number[]>();
export const documentCache = new Cache<any>();

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    embeddingCache.cleanup();
    documentCache.cleanup();
  }, 5 * 60 * 1000);
}
