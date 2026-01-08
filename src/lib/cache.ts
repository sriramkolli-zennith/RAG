/**
 * LRU Cache with TTL support for better memory management
 * For production, consider using Redis
 */

interface CacheEntry<T> {
  value: T;
  expiry: number;
  lastAccessed: number;
}

class LRUCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttlSeconds: number = 300) {
    const expiry = Date.now() + ttlSeconds * 1000;
    const entry: CacheEntry<T> = {
      value,
      expiry,
      lastAccessed: Date.now(),
    };

    // Evict LRU item if cache is full
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evictLRU();
    }

    this.store.set(key, entry);
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    
    // Update last accessed time
    entry.lastAccessed = Date.now();
    
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

  // Evict least recently used item
  private evictLRU() {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
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

  // Get cache statistics
  getStats() {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      utilizationPercent: (this.store.size / this.maxSize) * 100,
    };
  }
}

// Singleton caches with optimized sizes
export const embeddingCache = new LRUCache<number[]>(500); // Store up to 500 embeddings
export const documentCache = new LRUCache<any>(200); // Store up to 200 documents

// Cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    embeddingCache.cleanup();
    documentCache.cleanup();
  }, 5 * 60 * 1000);
}
