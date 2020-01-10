import NodeCache from "node-cache";
import { CsgoMap, NadeDTO } from "../nade/Nade";
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

  setRecentNades = (nades: NadeDTO[]) => {
    this.cache.set("recent", nades);

    for (let nade of nades) {
      this.setNade(nade.id, nade);
    }
  };

  getRecentNades = (): NadeDTO[] | undefined => {
    return this.cache.get("recent");
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

  delCacheWithMap = (map?: CsgoMap) => {
    if (!map) {
      return;
    }

    this.cache.del(map);
  };

  setNade = (nadeId: string, nade: NadeDTO) => {
    this.cache.set(nade.id, nade);
  };

  getNade = (nadeId: string): NadeDTO | undefined => {
    return this.cache.get(nadeId);
  };

  delNade = (nadeId: string) => {
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

  private unvalidateRecentIfNadePresent = (nadeId: string) => {
    const recentNades = this.cache.get<NadeDTO[]>("recent");

    if (recentNades) {
      const found = recentNades.find(n => n.id === nadeId);
      if (found) {
        this.cache.del("recent");
      }
    }
  };
}
