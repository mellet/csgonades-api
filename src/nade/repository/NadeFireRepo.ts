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
import { ImageData } from "../../imageGallery/ImageStorageRepo";
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

  getDeleted = async (): Promise<NadeDto[]> => {
    const declinedDocs = await query(this.collection, [
      where("status", "==", "deleted"),
      order("createdAt", "asc"),
      limit(10),
    ]);

    const declinedNades = declinedDocs.map(this.toNadeDTO);

    // @ts-ignore
    const nadesWithLegacyNades = declinedNades.filter((n) => n.images);

    const promises = nadesWithLegacyNades.map((n) => this.cleanupImages(n.id));

    await Promise.all(promises);

    return declinedNades;
  };

  getById = async (nadeId: string): Promise<NadeDto> => {
    const nadeDoc = await get(this.collection, nadeId);

    if (!nadeDoc) {
      throw ErrorFactory.NotFound(`Nade not found, ${nadeId}`);
    }

    // await this.cleanupImages(nadeId);

    return {
      ...nadeDoc.data,
      id: nadeDoc.ref.id,
      score: this.calcScore(nadeDoc.data),
    };
  };

  getBySlug = async (slug: string): Promise<NadeDto> => {
    const nadeDocs = await query(this.collection, [where("slug", "==", slug)]);

    if (!nadeDocs.length) {
      throw ErrorFactory.NotFound(`Nade not found, ${slug}`);
    }

    const nade = nadeDocs[0];

    // await this.cleanupImages(nade.ref.id);

    const freshNade = await this.getById(nade.ref.id);

    return freshNade;
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

    // @ts-ignore
    const nadesWithLegacyNades = nades.filter((n) => n.images);

    const promises = nadesWithLegacyNades.map((n) => this.cleanupImages(n.id));

    await Promise.all(promises);

    return nades;
  };

  getByUser = async (
    steamId: string,
    csgoMap?: CsgoMap
  ): Promise<NadeDto[]> => {
    const queryBuilder: Query<NadeFireModel, keyof NadeFireModel>[] = [
      where("steamId", "==", steamId),
    ];

    if (csgoMap) {
      queryBuilder.push(where("map", "==", csgoMap));
    }

    queryBuilder.push(order("createdAt", "desc"));

    const nadeDocs = await query(this.collection, queryBuilder);

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
    setNewUpdateNade?: boolean,
    setNewCreatedAt?: boolean
  ): Promise<NadeDto> => {
    let modelUpdates: ModelUpdate<NadeFireModel> = {
      ...updates,
      lastGfycatUpdate: updates.lastGfycatUpdate
        ? value("serverDate")
        : undefined,
      updatedAt: setNewUpdateNade ? value("serverDate") : undefined,
      createdAt: setNewCreatedAt ? value("serverDate") : undefined,
    };

    await update(this.collection, nadeId, removeUndefines(modelUpdates));

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

    const pop = nade.favoriteCount + nade.commentCount || 1;

    const intScore = (pop / (nade.viewCount || 1)) * 1000;

    // Inflate new nades to allow them to get views
    const freshScore = this.freshScore(addedHoursAgo);
    const hotScore = freshScore + ageScore + interactionScore + intScore;

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

  // Remove once all images are fixed
  private cleanupImages = async (nadeId: string) => {
    const nade = await this.getById(nadeId);

    const nadeLogId = nade.slug || nade.id;

    const touchedElements: string[] = [];

    if (!nade.images) {
      return;
    } else {
      const mainImage = this.extractMainImage(nade);
      const lineUpImage = this.extractLineupImage(nade);
      const lineUpImageThumb = this.extractLineupThumbImage(nade);

      // Sync mainImage
      if (!mainImage) {
        console.log(`${nadeLogId} > !!! Could not find main image"`, nade);
        return;
      } else if (mainImage && !nade.imageMain) {
        touchedElements.push("imageMain");
        await update(this.collection, nadeId, { imageMain: mainImage });
      }

      // Synce lineupImage
      if (lineUpImage && !nade.imageLineup) {
        touchedElements.push("imageLineup");
        await update(this.collection, nadeId, { imageLineup: lineUpImage });
      }

      if (lineUpImageThumb && !nade.imageLineupThumb) {
        touchedElements.push("imageLineupThumb");
        await update(this.collection, nadeId, {
          imageLineupThumb: lineUpImageThumb,
        });
      }

      await update(this.collection, nadeId, { images: value("remove") });
      console.log(
        `${nade.map} | ${nadeLogId} > Updated`,
        touchedElements.join(", ")
      );
    }
  };

  private extractMainImage = (nade: NadeDto): ImageData | undefined => {
    if (nade.imageMain) {
      return this.getImageDataFromUrl(nade.imageMain.url, "nades");
    } else {
      if (!nade.images?.thumbnailUrl) {
        console.log("Unexpected missing main image", nade);
        return;
      }

      return this.getImageDataFromUrl(nade.images.thumbnailUrl, "nades");
    }
  };

  private extractLineupImage = (nade: NadeDto): ImageData | undefined => {
    if (nade.imageLineup) {
      return this.getImageDataFromUrl(nade.imageLineup.url, "lineup");
    } else if (!nade.images?.lineupUrl) {
      return undefined;
    } else {
      return this.getImageDataFromUrl(nade.images.lineupUrl, "lineup");
    }
  };

  private extractLineupThumbImage = (nade: NadeDto): ImageData | undefined => {
    if (!nade.imageLineupThumb) {
      return;
    } else {
      return this.getImageDataFromUrl(nade.imageLineupThumb.url, "lineup");
    }
  };

  private getImageDataFromUrl = (
    url: string,
    collection: string
  ): ImageData => {
    const fixedUrl = url.replace("%2F", "/");
    const parts = fixedUrl.split("/");
    const id = parts.pop() as string;

    return {
      id,
      collection,
      url: fixedUrl,
    };
  };
}
