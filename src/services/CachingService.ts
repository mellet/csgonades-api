import NodeCache from "node-cache";
import { NadeDTO, NadeLightDTO } from "../nade/Nade";
import { CsgoMap } from "../nade/nadeSubTypes/CsgoMap";
import { TournamentModel } from "../tournament/Tournament";

export class CachingService {
  private cache: NodeCache;
  private defaultTTL = 60 * 60 * 24; // 24 hours
  private recentKey = "recent";

  constructor() {
    this.cache = new NodeCache({ stdTTL: this.defaultTTL });
  }

  setUserNades = (steamId: string, nades: NadeLightDTO[]) => {
    this.cache.set(`unades-${steamId}`, nades);
  };

  getUserNades = (steamId: string) => {
    return this.cache.get<NadeLightDTO[]>(`unades-${steamId}`);
  };

  invalidateUserNades = (steamId: string) => {
    this.cache.del(`unades-${steamId}`);
  };

  setGeneric = (key: string, value: any) => {
    const genericTtl = 60 * 10;
    this.cache.set(key, value, genericTtl);
  };

  getGeneric = <T>(key: string): T => {
    // @ts-ignore
    return this.cache.get(key);
  };

  setTournaments = (tournaments: TournamentModel[]) => {
    this.cache.set("tournaments", tournaments);
  };

  getTournaments = () => {
    return this.cache.get<TournamentModel[]>("tournaments");
  };

  flushTournaments = () => {
    this.cache.del("tournaments");
  };

  setRecentNades = (nades: NadeDTO[]) => {
    this.cache.set(this.recentKey, nades);

    for (let nade of nades) {
      this.setNade(nade.id, nade);
    }
  };

  getRecentNades = (): NadeDTO[] | undefined => {
    return this.cache.get(this.recentKey);
  };

  setByMap = (map: CsgoMap, nades: NadeDTO[]) => {
    this.cache.set(map, nades);

    for (let nade of nades) {
      this.setNade(nade.id, nade);
    }
  };

  getByMap = (map: CsgoMap) => {
    return this.cache.get<NadeDTO[]>(map);
  };

  setNade = (nadeId: string, nade: NadeDTO) => {
    this.cache.set(nade.id, nade);
  };

  getNade = (nadeId: string): NadeDTO | undefined => {
    return this.cache.get(nadeId);
  };

  invalidateNade = (nadeId: string) => {
    const nade = this.getNade(nadeId);
    if (nade) {
      this.cache.del(nade.id);
      this.unvalidateRecentIfNadePresent(nade.id);
      this.delCacheWithMap(nade.map);
    }
  };

  getStats = () => {
    return this.cache.getStats();
  };

  flushAll = () => {
    this.cache.flushAll();
  };

  invalidateRecent = () => {
    this.cache.del(this.recentKey);
  };

  invalidateMap = (map?: CsgoMap) => {
    if (!map) {
      return;
    }
    this.cache.del(map);
  };

  private unvalidateRecentIfNadePresent = (nadeId: string) => {
    const recentNades = this.cache.get<NadeDTO[]>(this.recentKey);

    if (recentNades) {
      const found = recentNades.find((n) => n.id === nadeId);
      if (found) {
        this.cache.del(this.recentKey);
      }
    }
  };

  private delCacheWithMap = (map?: CsgoMap) => {
    if (!map) {
      return;
    }

    this.cache.del(map);
  };
}
