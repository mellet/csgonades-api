import moment from "moment";
import {
  add,
  batch,
  collection,
  Collection,
  Doc,
  get,
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
import { UserLightModel } from "../../user/UserModel";
import { removeUndefines } from "../../utils/Common";
import { ErrorFactory } from "../../utils/ErrorUtil";
import { NadeCreateModel } from "../dto/NadeCreateModel";
import { NadeDto } from "../dto/NadeDto";
import { NadeFireModel } from "../dto/NadeFireModel";
import { CsgoMap } from "../nadeSubTypes/CsgoMap";
import { NadeType } from "../nadeSubTypes/NadeType";
import { NadeRepo } from "./NadeRepo";

export class NadeFireRepo implements NadeRepo {
  private collection: Collection<NadeFireModel>;

  constructor() {
    this.collection = collection("nades");
  }

  isSlugAvailable = async (slug: string): Promise<boolean> => {
    const nadeDocs = await query(this.collection, [where("slug", "==", slug)]);

    if (nadeDocs.length === 0) {
      return true;
    }

    return false;
  };

  getAll = async (nadeLimit?: number): Promise<NadeDto[]> => {
    const queryBuilder: Query<NadeFireModel, keyof NadeFireModel>[] = [
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

  getPending = async (): Promise<NadeDto[]> => {
    const pendingDocs = await query(this.collection, [
      where("status", "==", "pending"),
      order("createdAt", "desc"),
    ]);

    const pendingNades = pendingDocs.map(this.toNadeDTO);
    return pendingNades;
  };

  getDeclined = async (): Promise<NadeDto[]> => {
    const declinedDocs = await query(this.collection, [
      where("status", "==", "declined"),
      order("createdAt", "desc"),
    ]);

    const declinedNades = declinedDocs.map(this.toNadeDTO);
    return declinedNades;
  };

  getById = async (nadeId: string): Promise<NadeDto> => {
    const nadeDoc = await get(this.collection, nadeId);

    if (!nadeDoc) {
      throw ErrorFactory.NotFound("Nade not found");
    }

    return {
      ...nadeDoc.data,
      id: nadeDoc.ref.id,
      score: this.calcScore(nadeDoc.data),
    };
  };

  getBySlug = async (slug: string): Promise<NadeDto> => {
    const nadeDocs = await query(this.collection, [where("slug", "==", slug)]);

    if (!nadeDocs.length) {
      throw ErrorFactory.NotFound("Nade not found");
    }

    const nade = nadeDocs[0];

    return {
      ...nade.data,
      id: nade.ref.id,
      score: this.calcScore(nade.data),
    };
  };

  getByMap = async (
    csgoMap: CsgoMap,
    nadeType?: NadeType
  ): Promise<NadeDto[]> => {
    const queryBuilder: Query<NadeFireModel, keyof NadeFireModel>[] = [
      where("status", "==", "accepted"),
      where("map", "==", csgoMap),
    ];

    if (nadeType) {
      queryBuilder.push(where("type", "==", nadeType));
    }

    queryBuilder.push(order("createdAt", "desc"));

    const nadeDocs = await query(this.collection, queryBuilder);

    const nades = nadeDocs.map(this.toNadeDTO);

    return nades;
  };

  getByUser = async (steamId: string): Promise<NadeDto[]> => {
    const nadeDocs = await query(this.collection, [
      where("steamId", "==", steamId),
      order("createdAt", "desc"),
    ]);

    const allNades = nadeDocs.map(this.toNadeDTO);
    const nades = allNades.filter((n) => n.status !== "deleted");
    return nades;
  };

  save = async (nadeCreate: NadeCreateModel): Promise<NadeDto> => {
    const nadeModel: NadeFireModel = {
      ...nadeCreate,
      createdAt: value("serverDate"),
      updatedAt: value("serverDate"),
      lastGfycatUpdate: value("serverDate"),
      status: "pending",
    };

    const cleanNadeModel = removeUndefines(nadeModel);

    const nade = await add(this.collection, cleanNadeModel);

    return this.toNadeDTO(nade);
  };

  update = async (
    nadeId: string,
    updates: Partial<NadeFireModel>,
    setNewUpdateNade?: boolean
  ): Promise<NadeDto> => {
    let modelUpdates: ModelUpdate<NadeFireModel> = {
      ...updates,
      lastGfycatUpdate: updates.lastGfycatUpdate
        ? value("serverDate")
        : undefined,
      updatedAt: setNewUpdateNade ? value("serverDate") : undefined,
    };

    modelUpdates = removeUndefines(modelUpdates);

    await update(this.collection, nadeId, modelUpdates);

    const nade = await this.getById(nadeId);

    return nade;
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
        user: {
          nickname: user.nickname,
          steamId: user.steamId,
          avatar: user.avatar,
        },
      });
    });

    await commit();
  };

  incrementFavoriteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      favoriteCount: value("increment", 1),
    });

    return this.getById(nadeId);
  };

  decrementFavoriteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      favoriteCount: value("increment", -1),
    });

    return this.getById(nadeId);
  };

  incrementCommentCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      commentCount: value("increment", 1),
    });

    return this.getById(nadeId);
  };

  decrementCommentCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      commentCount: value("increment", -1),
    });

    return this.getById(nadeId);
  };

  incementUpVoteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      upVoteCount: value("increment", 1),
    });

    return this.getById(nadeId);
  };

  decrementUpVoteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      upVoteCount: value("increment", -1),
    });
    return this.getById(nadeId);
  };

  incementDownVoteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      downVoteCount: value("increment", 1),
    });
    return this.getById(nadeId);
  };

  decrementDownVoteCount = async (nadeId: string) => {
    update(this.collection, nadeId, {
      downVoteCount: value("increment", -1),
    });
    return this.getById(nadeId);
  };

  private toNadeDTO = (doc: Doc<NadeFireModel>): NadeDto => {
    return {
      ...doc.data,
      id: doc.ref.id,
      score: this.calcScore(doc.data),
    };
  };

  private calcScore = (nade: NadeFireModel): number => {
    const addedHoursAgo = moment().diff(moment(nade.createdAt), "hours", false);
    const proBonus = nade.isPro ? 1.02 : 1.0;

    const interactionScore = this.interactionScore(
      addedHoursAgo,
      nade.commentCount,
      nade.favoriteCount
    );
    const ageScore = Math.log(50000 - addedHoursAgo) * 0.3;

    // Inflate new nades to allow them to get views
    const freshScore = this.freshScore(addedHoursAgo);
    const hotScore = freshScore + ageScore + interactionScore;

    return hotScore * proBonus;
  };

  private freshScore(addedHoursAgo: number) {
    const bonusFreshScore = Math.log(50000 - addedHoursAgo || 1);

    if (addedHoursAgo < 48) {
      return bonusFreshScore + 10;
    } else if (addedHoursAgo < 24 * 7) {
      return bonusFreshScore * 0.65;
    } else if (addedHoursAgo < 24 * 14) {
      return bonusFreshScore * 0.45;
    } else {
      return 0;
    }
  }

  private interactionScore = (
    addedHoursAgo: number,
    commentCount?: number,
    favCount?: number
  ) => {
    const addedWeeksAgo = addedHoursAgo / 24 / 7;
    const commentScore = commentCount || 0;
    let favScore = (favCount || 0) <= 2 ? 0 : favCount || 0;

    const multiplier = 20 / addedWeeksAgo;

    if (addedWeeksAgo < 10) {
      favScore = favScore * multiplier;
    }

    const interactionScore = Math.log(commentScore + favScore || 1);

    return interactionScore;
  };
}
