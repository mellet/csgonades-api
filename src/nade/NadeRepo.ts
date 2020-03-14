import moment from "moment";
import slugify from "slugify";
import {
  add,
  batch,
  collection,
  Collection,
  Doc,
  get,
  getMany,
  limit,
  order,
  query,
  Query,
  remove,
  update,
  value,
  where
} from "typesaurus";
import { ModelUpdate } from "typesaurus/update";
import { UserLightModel } from "../user/UserModel";
import { removeUndefines } from "../utils/Common";
import { ErrorFactory } from "../utils/ErrorUtil";
import { CsgoMap, NadeCreateModel, NadeDTO, NadeModel } from "./Nade";

export class NadeRepo {
  private collection: Collection<NadeModel>;

  constructor() {
    this.collection = collection("nades");
  }

  getAll = async (nadeLimit?: number): Promise<NadeDTO[]> => {
    const queryBuilder: Query<NadeModel, keyof NadeModel>[] = [
      where("status", "==", "accepted"),
      order("createdAt", "desc")
    ];

    if (nadeLimit) {
      queryBuilder.push(limit(nadeLimit));
    }

    const nadesDocs = await query(this.collection, queryBuilder);

    const nades = nadesDocs.map(this.toNadeDTO);

    return nades;
  };

  pending = async (): Promise<NadeDTO[]> => {
    const pendingDocs = await query(this.collection, [
      where("status", "==", "pending"),
      order("createdAt", "desc")
    ]);

    const pendingNades = pendingDocs.map(this.toNadeDTO);
    return pendingNades;
  };

  byId = async (nadeId: string): Promise<NadeDTO> => {
    const nadeDoc = await get(this.collection, nadeId);

    if (!nadeDoc) {
      throw ErrorFactory.NotFound("Nade not found");
    }

    return {
      ...nadeDoc.data,
      id: nadeDoc.ref.id,
      score: this.calcScore(nadeDoc.data)
    };
  };

  bySlug = async (slug: string): Promise<NadeDTO> => {
    const nadeDocs = await query(this.collection, [where("slug", "==", slug)]);

    if (!nadeDocs.length) {
      throw ErrorFactory.NotFound("Nade not found");
    }

    const nade = nadeDocs[0];

    return {
      ...nade.data,
      id: nade.ref.id,
      score: this.calcScore(nade.data)
    };
  };

  byMap = async (csgoMap: CsgoMap): Promise<NadeDTO[]> => {
    const queryBuilder: Query<NadeModel, keyof NadeModel>[] = [
      where("status", "==", "accepted"),
      where("map", "==", csgoMap),
      order("createdAt", "desc")
    ];

    const nadeDocs = await query(this.collection, queryBuilder);

    const nades = nadeDocs.map(this.toNadeDTO);

    return nades;
  };

  byUser = async (steamId: string): Promise<NadeDTO[]> => {
    const nadeDocs = await query(this.collection, [
      where("steamId", "==", steamId),
      order("createdAt", "desc")
    ]);

    const nades = nadeDocs.map(this.toNadeDTO);
    return nades;
  };

  list = async (ids: string[]): Promise<NadeDTO[]> => {
    const nadeDocs = await getMany(this.collection, ids);
    const nades = nadeDocs.map(this.toNadeDTO);

    return nades;
  };

  save = async (nadeCreate: NadeCreateModel): Promise<NadeDTO> => {
    const nadeModel: NadeModel = {
      ...nadeCreate,
      createdAt: value("serverDate"),
      updatedAt: value("serverDate"),
      lastGfycatUpdate: value("serverDate"),
      status: "pending"
    };

    const nade = await add(this.collection, nadeModel);

    return this.toNadeDTO(nade);
  };

  update = async (
    nadeId: string,
    updates: Partial<NadeModel>
  ): Promise<NadeDTO> => {
    let modelUpdates: ModelUpdate<NadeModel> = {
      ...updates,
      lastGfycatUpdate: updates.lastGfycatUpdate
        ? value("serverDate")
        : undefined
    };

    modelUpdates = removeUndefines(modelUpdates);

    await update(this.collection, nadeId, modelUpdates);

    const nade = await this.byId(nadeId);

    await this.tryCreateUnqieuSlug(nade);

    return nade;
  };

  tryCreateUnqieuSlug = async (nade: NadeDTO) => {
    const { slug, title, map, type } = nade;
    if (slug || !title || !map || !type) {
      return;
    }

    const fullTitle = `${map} ${type} ${title}`;

    const createdSlug = slugify(fullTitle, { replacement: "-", lower: true });

    const findSameSlug = await query(this.collection, [
      where("slug", "==", createdSlug)
    ]);

    if (findSameSlug.length) {
      // TODO: Make unique slug
      return;
    }

    let modelUpdates: ModelUpdate<NadeModel> = {
      slug: createdSlug
    };

    console.log("> Created slug", createdSlug);

    await update(this.collection, nade.id, modelUpdates);
  };

  delete = async (nadeId: string) => {
    await remove(this.collection, nadeId);
  };

  updateUserOnNades = async (steamId: string, user: UserLightModel) => {
    const nadeDocsByUser = await query(this.collection, [
      where("steamId", "==", steamId)
    ]);

    const { update, commit } = batch();

    nadeDocsByUser.forEach(doc => {
      update(this.collection, doc.ref.id, {
        steamId: user.steamId,
        user
      });
    });

    await commit();
  };

  incrementFavoriteCount = async (nadeId: string) => {
    return update(this.collection, nadeId, {
      favoriteCount: value("increment", 1)
    });
  };

  decrementFavoriteCount = async (nadeId: string) => {
    return update(this.collection, nadeId, {
      favoriteCount: value("increment", -1)
    });
  };

  private toNadeDTO = (doc: Doc<NadeModel>): NadeDTO => {
    return {
      ...doc.data,
      id: doc.ref.id,
      score: this.calcScore(doc.data)
    };
  };

  private calcScore = (nade: NadeModel): number => {
    const FAVORITE_WEIGHT = 200;

    const addedDaysAgo = moment().diff(moment(nade.createdAt), "days", true);
    const addedWeeksAgo = moment().diff(moment(nade.createdAt), "weeks", true);

    const viewScore = this.viewsPerWeek(nade.viewCount, addedDaysAgo);

    const ageScore = Math.round(10000 * Math.exp(-addedWeeksAgo));

    const favoriteScore =
      Math.max(nade.favoriteCount || 0, 1) * FAVORITE_WEIGHT;

    const hotScore = ageScore + viewScore + favoriteScore;

    return Math.round(hotScore);
  };

  private viewsPerWeek(views: number, daysAgo: number) {
    const weeksAgoAdded = Math.max(daysAgo / 7, 1);

    return Math.round(views / weeksAgoAdded);
  }
}
