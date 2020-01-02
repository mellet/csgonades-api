import {
  ArticleModelDoc,
  ArticleCreateDTO,
  ArticleDTO,
  ArticleUpdateDTO,
  ArticleLightDTO
} from "./Article";
import {
  collection,
  add,
  Collection,
  value,
  update,
  get,
  query,
  limit,
  order,
  Doc
} from "typesaurus";
import { removeUndefines } from "../utils/Common";
import { ErrorFactory } from "../utils/ErrorUtil";

export class ArticleRepo {
  private collection: Collection<ArticleModelDoc>;

  constructor() {
    this.collection = collection<ArticleModelDoc>("articles");
  }

  get = async (articleId: string): Promise<ArticleDTO> => {
    const articleDoc = await get(this.collection, articleId);

    if (!articleDoc) {
      throw ErrorFactory.NotFound("Article not found");
    }

    return {
      ...articleDoc.data,
      id: articleDoc.ref.id
    };
  };

  getAll = async (articleLimit: number = 0): Promise<ArticleLightDTO[]> => {
    const res = await query(this.collection, [
      order("createdAt", "desc"),
      articleLimit && limit(articleLimit)
    ]);

    function articleConvert(doc: Doc<ArticleModelDoc>): ArticleLightDTO {
      return {
        id: doc.ref.id,
        title: doc.data.title,
        excerpt: doc.data.body.substring(0, 100),
        createdAt: doc.data.createdAt,
        status: doc.data.status
      };
    }

    const articles = res.map(articleConvert);

    return articles;
  };

  save = async (articleModel: ArticleCreateDTO): Promise<ArticleDTO> => {
    const res = await add(this.collection, {
      title: articleModel.title,
      body: articleModel.body,
      status: "draft",
      createdAt: value("serverDate"),
      updatedAt: value("serverDate")
    });

    return {
      ...res.data,
      id: res.ref.id
    };
  };

  update = async (
    articleId: string,
    updates: ArticleUpdateDTO
  ): Promise<ArticleDTO> => {
    const cleanUpdates = removeUndefines(updates);

    await update(this.collection, articleId, {
      ...cleanUpdates,
      updatedAt: value("serverDate")
    });

    const res = await this.get(articleId);

    return res;
  };
}
