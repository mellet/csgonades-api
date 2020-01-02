import NodeCache from "node-cache";

export class CachingService {
  private cache: NodeCache;
  private defaultTTL = 1000 * 60 * 60 * 24; // 24 hours

  constructor() {
    this.cache = new NodeCache({
      stdTTL: this.defaultTTL
    });
  }

  set<T>(key: string, value: T) {
    this.cache.set<T>(key, value);
  }

  get<T>(key: string) {
    const value = this.cache.get<T>(key);
    return value;
  }

  del(key: string) {
    this.cache.del(key);
  }

  getStats() {
    return this.cache.getStats();
  }

  flushAll() {
    this.cache.flushAll();
  }
}
