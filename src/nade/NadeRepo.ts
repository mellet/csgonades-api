import moment from "moment";
import ShortUniqueId from "short-unique-id";
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
  where,
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
      order("createdAt", "desc"),
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
      order("createdAt", "desc"),
    ]);

    const pendingNades = pendingDocs.map(this.toNadeDTO);
    return pendingNades;
  };

  declined = async (): Promise<NadeDTO[]> => {
    const declinedDocs = await query(this.collection, [
      where("status", "==", "declined"),
      order("createdAt", "desc"),
    ]);

    const declinedNades = declinedDocs.map(this.toNadeDTO);
    return declinedNades;
  };

  byId = async (nadeId: string): Promise<NadeDTO> => {
    const nadeDoc = await get(this.collection, nadeId);

    if (!nadeDoc) {
      throw ErrorFactory.NotFound("Nade not found");
    }

    return {
      ...nadeDoc.data,
      id: nadeDoc.ref.id,
      score: this.calcScore(nadeDoc.data),
      nextUpdateInHours: 0,
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
      score: this.calcScore(nade.data),
      nextUpdateInHours: 0,
    };
  };

  byMap = async (csgoMap: CsgoMap): Promise<NadeDTO[]> => {
    const queryBuilder: Query<NadeModel, keyof NadeModel>[] = [
      where("status", "==", "accepted"),
      where("map", "==", csgoMap),
      order("createdAt", "desc"),
    ];

    const nadeDocs = await query(this.collection, queryBuilder);

    const nades = nadeDocs.map(this.toNadeDTO);

    return nades;
  };

  byUser = async (steamId: string): Promise<NadeDTO[]> => {
    const nadeDocs = await query(this.collection, [
      where("steamId", "==", steamId),
      order("createdAt", "desc"),
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
      status: "pending",
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
        : undefined,
    };

    modelUpdates = removeUndefines(modelUpdates);

    await update(this.collection, nadeId, modelUpdates);

    const nade = await this.byId(nadeId);

    return nade;
  };

  tryCreateUnqieuSlug = async (nade: NadeDTO) => {
    const { title, map, type } = nade;

    if (!title || !type) {
      return;
    }

    const fullTitle = `${type} ${title}`;

    const createdSlug = slugify(fullTitle, {
      replacement: "-",
      lower: true,
      remove: /[*+~.()'`"!:@]/g,
    });

    const findSameSlug = await query(this.collection, [
      where("slug", "==", createdSlug),
    ]);

    if (findSameSlug.length) {
      const uid = new ShortUniqueId();
      const uniqueSlug = `${createdSlug}-${uid.randomUUID(3)}`;
      const findSameUniqueSlug = await query(this.collection, [
        where("slug", "==", uniqueSlug),
      ]);

      if (!findSameUniqueSlug.length) {
        let modelUpdates: ModelUpdate<NadeModel> = {
          slug: uniqueSlug,
        };

        await update(this.collection, nade.id, modelUpdates);
      }
    } else {
      let modelUpdates: ModelUpdate<NadeModel> = {
        slug: createdSlug,
      };

      await update(this.collection, nade.id, modelUpdates);
    }
  };

  delete = async (nadeId: string) => {
    await remove(this.collection, nadeId);
  };

  updateUserOnNades = async (steamId: string, user: UserLightModel) => {
    const nadeDocsByUser = await query(this.collection, [
      where("steamId", "==", steamId),
    ]);

    const { update, commit } = batch();

    nadeDocsByUser.forEach((doc) => {
      update(this.collection, doc.ref.id, {
        steamId: user.steamId,
        user,
      });
    });

    await commit();
  };

  incrementFavoriteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      favoriteCount: value("increment", 1),
    });

    return this.byId(nadeId);
  };

  decrementFavoriteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      favoriteCount: value("increment", -1),
    });

    return this.byId(nadeId);
  };

  incrementCommentCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      commentCount: value("increment", 1),
    });

    return this.byId(nadeId);
  };

  decrementCommentCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      commentCount: value("increment", -1),
    });

    return this.byId(nadeId);
  };

  private toNadeDTO = (doc: Doc<NadeModel>): NadeDTO => {
    return {
      ...doc.data,
      id: doc.ref.id,
      score: this.calcScore(doc.data),
      nextUpdateInHours: 0,
    };
  };

  private calcScore = (nade: NadeModel): number => {
    const commentCount = (nade.commentCount || 1) * 1000;
    const favoriteCount = (nade.favoriteCount || 1) * 1000;
    const addedHoursAgo = moment().diff(moment(nade.createdAt), "hours", false);

    const interactionScore = Math.log(commentCount + favoriteCount);
    const ageScore = Math.log(50000 - addedHoursAgo) / 2;

    // Inflate new nades to allow them to get views
    const freshScore = this.freshScore(addedHoursAgo);
    const hotScore = freshScore + ageScore + interactionScore;

    return hotScore;
  };

  private freshScore(addedHoursAgo: number) {
    const freshDuration = 24 * 7;
    if (addedHoursAgo < 24) {
      return 100 - addedHoursAgo;
    }
    if (addedHoursAgo < freshDuration) {
      return Math.log(freshDuration - addedHoursAgo || 1) / 1.7;
    } else {
      return 0;
    }
  }
}
