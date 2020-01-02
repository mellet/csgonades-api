import NodeCache from "node-cache";
import { CsgoMap, NadeModel } from "../nade/Nade";
import { NadeFilter } from "../nade/NadeFilter";

export class CachingService {
  private cache: NodeCache;
  private defaultTTL = 1000 * 60 * 60 * 24; // 24 hours

  constructor() {
    this.cache = new NodeCache({ stdTTL: this.defaultTTL });
  }

  setAllNades(key: string, nades: NadeModel[]) {
    this.cache.set(key, nades);
  }

  getAllNades(key: string): NadeModel[] {
    return this.cache.get(key);
  }

  setByMap(map: CsgoMap, nades: NadeModel[], filter?: NadeFilter) {
    const cacheKey = `map-${map}-${JSON.stringify(filter)}`;
    this.cache.set(cacheKey, nades);
  }

  getByMap(map: CsgoMap, filter?: NadeFilter) {
    const cacheKey = `map-${map}-${JSON.stringify(filter)}`;
    return this.cache.get<NadeModel[]>(cacheKey);
  }

  delCacheWithMap(map?: CsgoMap) {
    if (!map) {
      return;
    }

    const cacheKeys = this.cache.keys();
    const staleKeys = cacheKeys.filter(key => key.includes(map));
    this.cache.del(staleKeys);
  }

  setNade(nadeId: string, nade: NadeModel) {
    const cacheKey = `nade-${nadeId}`;
    this.cache.set(cacheKey, nade);
  }

  getNade(nadeId: string): NadeModel {
    const cacheKey = `nade-${nadeId}`;
    return this.cache.get(cacheKey);
  }

  delNade(nadeId: string) {
    const cacheKey = `nade-${nadeId}`;
    this.cache.del(cacheKey);
  }

  getStats() {
    return this.cache.getStats();
  }

  flushAll() {
    this.cache.flushAll();
  }
}
