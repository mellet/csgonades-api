import NodeCache from "node-cache";
import { CsgoMap, NadeDTO } from "../nade/Nade";
import { NadeFilter } from "../nade/NadeFilter";
import { TournamentModel } from "../tournament/Tournament";

export class CachingService {
  private cache: NodeCache;
  private defaultTTL = 1000 * 60 * 60 * 48; // 48 hours

  constructor() {
    this.cache = new NodeCache({ stdTTL: this.defaultTTL });
  }

  setTournaments = (tournaments: TournamentModel[]) => {
    this.cache.set("tournaments", tournaments);
  };

  getTournaments = () => {
    return this.cache.get<TournamentModel[]>("tournaments");
  };

  flushTournaments = () => {
    this.cache.del("tournaments");
  };

  setAllNades = (key: string, nades: NadeDTO[]) => {
    this.cache.set(key, nades);

    for (let nade of nades) {
      this.setNade(nade.id, nade);
    }
  };

  getAllNades = (key: string): NadeDTO[] | undefined => {
    return this.cache.get(key);
  };

  setByMap = (map: CsgoMap, nades: NadeDTO[], filter?: NadeFilter) => {
    const cacheKey = `map-${map}-${JSON.stringify(filter)}`;
    this.cache.set(cacheKey, nades);

    for (let nade of nades) {
      this.setNade(nade.id, nade);
    }
  };

  getByMap = (map: CsgoMap, filter?: NadeFilter) => {
    const cacheKey = `map-${map}-${JSON.stringify(filter)}`;
    return this.cache.get<NadeDTO[]>(cacheKey);
  };

  delCacheWithMap = (map?: CsgoMap) => {
    if (!map) {
      return;
    }

    const cacheKeys = this.cache.keys();
    const staleKeys = cacheKeys.filter(key => key.includes(map));
    this.cache.del(staleKeys);
  };

  setNade = (nadeId: string, nade: NadeDTO) => {
    const cacheKey = `nade-${nadeId}`;
    this.cache.set(cacheKey, nade);
  };

  getNade = (nadeId: string): NadeDTO | undefined => {
    const cacheKey = `nade-${nadeId}`;
    return this.cache.get(cacheKey);
  };

  delNade = (nadeId: string) => {
    const nade = this.getNade(nadeId);
    if (nade) {
      this.delCacheWithMap(nade.map);
      const cacheKey = `nade-${nadeId}`;
      this.cache.del(cacheKey);
    }
  };

  getStats = () => {
    return this.cache.getStats();
  };

  flushAll = () => {
    this.cache.flushAll();
  };
}
