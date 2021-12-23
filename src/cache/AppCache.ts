import NodeCache from "node-cache";

export interface IAppCache {
  get: <T>(key: string) => T | undefined;
  set: <T>(key: string, value: T) => void;
}

export class AppCache implements IAppCache {
  private cache: NodeCache;

  constructor(ttlSeconds: number) {
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

  flush = () => {
    this.cache.flushAll();
  };
}
