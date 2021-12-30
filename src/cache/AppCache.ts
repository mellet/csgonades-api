import NodeCache from "node-cache";

export interface IAppCache {
  get: <T>(key: string) => T | undefined;
  set: <T>(key: string, value: T) => void;
  del: (key: string) => void;
}

type CacheDuration = "oneHour" | "twelveHour" | "oneDay";

function cacheDurationAsSeconds(cacheDuration: CacheDuration) {
  const oneHour = 60 * 60 * 1;

  switch (cacheDuration) {
    case "oneDay":
      return oneHour * 24;
    case "twelveHour":
      return oneHour * 12;
    case "oneHour":
      return oneHour;
    default:
      return oneHour;
  }
}

export class AppCache implements IAppCache {
  private cache: NodeCache;

  constructor(duration: CacheDuration) {
    const ttlSeconds = cacheDurationAsSeconds(duration);
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
}
