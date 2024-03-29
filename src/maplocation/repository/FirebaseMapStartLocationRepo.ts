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
import {
  AddMapStartLocation,
  EditMapStartLocation,
  MapStartLocation,
  MapStartLocationDocData,
} from "../types/MapStartLocation";
import { MapStartLocationRepo } from "../types/MapStartLocationRepo";

export class FirebaseMapStartLocationRepo implements MapStartLocationRepo {
  private collection: Collection<MapStartLocationDocData>;
  private cache: AppCache;

  constructor() {
    this.collection = collection("startlocation");
    this.cache = new AppCache({ cacheHours: 24 });
  }

  getNadeStartLocations = async (
    csMap: CsMap,
    gameMode: GameMode
  ): Promise<MapStartLocation[]> => {
    const cacheKey = ["mapEndLocations", csMap, gameMode].join("");
    const cachedResult = this.cache.get<MapStartLocation[]>(cacheKey);

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

  addNadeStartLocation = async (startLocation: AddMapStartLocation) => {
    const result = await add(this.collection, {
      calloutName: startLocation.calloutName,
      map: startLocation.map,
      position: startLocation.position,
      labelPosition: startLocation.labelPosition,
      gameMode: startLocation.gameMode,
    });

    const doc = await this.getById(result.id);

    if (!doc) {
      return null;
    }

    this.cache.flush();

    return doc;
  };

  editNadeStartLocation = async (startLocationUpdate: EditMapStartLocation) => {
    const edit: UpdateModel<MapStartLocationDocData> = removeUndefines({
      ...startLocationUpdate,
      gameMode: startLocationUpdate.gameMode || "csgo", // Todo: Remove when all updated
    });

    try {
      await update(this.collection, startLocationUpdate.id, edit);
      const result = await this.getById(startLocationUpdate.id);

      this.cache.flush();

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

      if (!result) {
        return null;
      }
      return this.toDto(result);
    } catch (error) {
      console.error("MapStartLocation.getById", error);
      return null;
    }
  };

  private toDto = (doc: Doc<MapStartLocationDocData>): MapStartLocation => {
    return {
      id: doc.ref.id,
      calloutName: doc.data.calloutName,
      map: doc.data.map,
      position: doc.data.position,
      labelPosition: doc.data.labelPosition,
      gameMode: doc.data.gameMode || "csgo",
    };
  };
}
