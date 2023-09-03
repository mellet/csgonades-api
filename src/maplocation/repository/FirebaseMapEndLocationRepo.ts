import {
  Collection,
  Doc,
  add,
  collection,
  get,
  query,
  remove,
  where,
} from "typesaurus";
import update, { UpdateModel } from "typesaurus/update";
import { CsMap } from "../../nade/nadeSubTypes/CsgoMap";
import { GameMode } from "../../nade/nadeSubTypes/GameMode";
import { NadeType } from "../../nade/nadeSubTypes/NadeType";
import { removeUndefines } from "../../utils/Common";
import {
  AddMapEndLocation,
  EditMapEndLocation,
  MapEndLocation,
  MapEndLocationDocData,
} from "../types/MapEndLocation";
import { MapEndLocationRepo } from "../types/MapEndLocationRepo";

export class FirebaseMapEndLocationRepo implements MapEndLocationRepo {
  private collection: Collection<MapEndLocationDocData>;

  constructor() {
    this.collection = collection("endlocation");
  }

  getMapEndLocations = async (
    csMap: CsMap,
    nadeType: NadeType,
    gameMode: GameMode
  ): Promise<MapEndLocation[]> => {
    const result = await query(this.collection, [
      where("map", "==", csMap),
      where("type", "==", nadeType),
      where("gameMode", "==", gameMode),
    ]);
    return result.map(this.toDto);
  };

  save = async (
    endLocation: AddMapEndLocation
  ): Promise<MapEndLocation | null> => {
    const result = await add(this.collection, {
      calloutName: endLocation.calloutName,
      map: endLocation.map,
      position: endLocation.position,
      type: endLocation.type,
      gameMode: endLocation.gameMode,
    });

    const doc = await this.getById(result.id);

    if (!doc) {
      return null;
    }

    return doc;
  };

  edit = async (
    endLocation: EditMapEndLocation
  ): Promise<MapEndLocation | null> => {
    const edit: UpdateModel<MapEndLocationDocData> = removeUndefines({
      calloutName: endLocation.calloutName,
      map: endLocation.map,
      position: endLocation.position,
      type: endLocation.type,
      gameMode: endLocation.gameMode || "csgo", // TODO: Remove once all updates
    });

    try {
      await update(this.collection, endLocation.id, edit);
      const result = await this.getById(endLocation.id);

      return result;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  removeById = async (id: string): Promise<"success" | "failure"> => {
    try {
      await remove(this.collection, id);
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
      console.error("MapEndLocation.getById", error);
      return null;
    }
  };

  private toDto = (doc: Doc<MapEndLocationDocData>): MapEndLocation => {
    return {
      id: doc.ref.id,
      calloutName: doc.data.calloutName,
      map: doc.data.map,
      position: doc.data.position,
      type: doc.data.type,
      gameMode: doc.data.gameMode,
    };
  };
}
