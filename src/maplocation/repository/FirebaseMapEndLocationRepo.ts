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
    nadeType: NadeType
  ): Promise<MapEndLocation[]> => {
    const result = await query(this.collection, [
      where("map", "==", csMap),
      where("type", "==", nadeType),
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
    });

    const doc = await this.getById(result.id);

    if (!doc) {
      return null;
    }

    return this.toDto(doc);
  };

  edit = async (
    endLocation: EditMapEndLocation
  ): Promise<MapEndLocation | null> => {
    const edit: UpdateModel<MapEndLocationDocData> = removeUndefines({
      calloutName: endLocation.calloutName,
      map: endLocation.map,
      position: endLocation.position,
      type: endLocation.type,
    });

    try {
      await update(this.collection, endLocation.id, edit);
      const result = await this.getById(endLocation.id);

      return result ? this.toDto(result) : null;
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

  private getById = async (id: string) => {
    const result = await get(this.collection, id);
    return result;
  };

  private toDto = (doc: Doc<MapEndLocationDocData>): MapEndLocation => {
    return {
      id: doc.ref.id,
      calloutName: doc.data.calloutName,
      map: doc.data.map,
      position: doc.data.position,
      type: doc.data.type,
    };
  };
}
