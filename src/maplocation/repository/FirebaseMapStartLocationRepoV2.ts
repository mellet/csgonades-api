import {
  Collection,
  Doc,
  add,
  collection,
  get,
  query,
  remove,
  update,
  where,
} from "typesaurus";
import { UpdateModel } from "typesaurus/update";
import { AppCache } from "../../cache/AppCache";
import { Logger } from "../../logger/Logger";
import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";
import { GameMode } from "../../nade/nadeSubTypes/GameMode";
import { removeUndefines } from "../../utils/Common";
import { MapStartLocationRepoV2 } from "../types/MapStartLocationRepoV2";
import {
  AddMapStartLocationV2,
  EditMapStartLocationV2,
  MapStartLocationDocDataV2,
  MapStartLocationV2,
} from "../types/MapStartLocationV2";

export class FirebaseMapStartLocationRepoV2 implements MapStartLocationRepoV2 {
  private collection: Collection<MapStartLocationDocDataV2>;
  private cache: AppCache;

  constructor() {
    this.collection = collection("mapStartLocation");
    this.cache = new AppCache({ cacheHours: 24 });
  }

  getNadeStartLocations = async (
    csMap: CsMap,
    gameMode: GameMode
  ): Promise<MapStartLocationV2[]> => {
    const cacheKey = ["mapEndLocations", csMap, gameMode].join("");
    const cachedResult = this.cache.get<MapStartLocationV2[]>(cacheKey);

    if (cachedResult) {
      Logger.verbose(
        `MapStartLocationRepo.getNadeStartLocations -> ${cachedResult.length} | CACHE`
      );
      return cachedResult;
    }

    const result = await query(this.collection, [
      where("map", "==", csMap),
      where("gameMode", "==", gameMode),
    ]);

    const locations = result.map(this.toDto);

    this.cache.set(cacheKey, locations);

    Logger.verbose(
      `MapStartLocationRepo.getNadeStartLocations -> ${locations.length} | DB`
    );

    return locations;
  };

  addNadeStartLocation = async (
    startLocation: AddMapStartLocationV2
  ): Promise<MapStartLocationV2 | null> => {
    try {
      const result = await add(this.collection, {
        calloutName: startLocation.calloutName,
        map: startLocation.map,
        position: startLocation.position,
        gameMode: startLocation.gameMode,
        enabled: false,
      });

      const doc = await this.getById(result.id);

      if (!doc) {
        return null;
      }

      this.cache.flush();
      return doc;
    } catch (error) {
      Logger.error("MapStartLocationRepo.addNadeStartLocation failed", error);
      return null;
    }
  };

  editNadeStartLocation = async (
    startLocationUpdate: EditMapStartLocationV2
  ) => {
    const edit: UpdateModel<MapStartLocationDocDataV2> =
      removeUndefines(startLocationUpdate);

    try {
      await update(this.collection, startLocationUpdate.id, edit);
      const result = await this.getById(startLocationUpdate.id);

      result && this.cache.flush();

      return result ? result : null;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  deleteNadeStartLocation = async (id: string) => {
    try {
      await remove(this.collection, id);
      this.cache.flush();
      return "success";
    } catch (error) {
      return "failure";
    }
  };

  getById = async (id: string) => {
    try {
      const result = await get(this.collection, id);

      return result ? this.toDto(result) : null;
    } catch (error) {
      console.error("MapStartLocation.getById", error);
      return null;
    }
  };

  private toDto = (doc: Doc<MapStartLocationDocDataV2>): MapStartLocationV2 => {
    return {
      id: doc.ref.id,
      calloutName: doc.data.calloutName,
      map: doc.data.map,
      position: doc.data.position,
      gameMode: doc.data.gameMode || "csgo",
      enabled: doc.data.enabled,
    };
  };
}
