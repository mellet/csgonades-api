import NodeCache from "node-cache";

export interface ICache {
  get: <T>(key: string) => T | undefined;
  set: <T>(key: string, value: T) => void;
  del: (key: string) => void;
  flush: () => void;

  stats: () => CacheStats;
}

type CacheConfig = {
  cacheHours: number;
};

type CacheStats = {
  hits: number;
  misses: number;
};

export class AppCache implements ICache {
  private cache: NodeCache;

  constructor(config: CacheConfig) {
    const ttlSeconds = config.cacheHours * 60 * 60;
    this.cache = new NodeCache({
      stdTTL: ttlSeconds,
      checkperiod: ttlSeconds * 0.2,
      useClones: false,
    });
  }

  get = <T>(key: string): T | undefined => {
    return this.cache.get<T>(key);
  };

  set = <T>(key: string, value: T) => {
    this.cache.set(key, value);
  };

  del = (key: string) => {
    this.cache.del(key);
  };

  flush = () => {
    this.cache.flushAll();
  };

  stats = (): CacheStats => {
    const stats = this.cache.getStats();

    return {
      hits: stats.hits,
      misses: stats.misses,
    };
  };
}
