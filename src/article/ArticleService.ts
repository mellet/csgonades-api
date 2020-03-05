import {
  ArticleCreateDTO,
  ArticleDTO,
  ArticleLightDTO,
  ArticleUpdateDTO
} from "./Article";
import { ArticleRepo } from "./ArticleRepo";

type ArticleServiceDeps = {
  articleRepo: ArticleRepo;
};

export class ArticleService {
  private articleRepo: ArticleRepo;

  constructor(deps: ArticleServiceDeps) {
    this.articleRepo = deps.articleRepo;
  }

  get = async (articleId: string): Promise<ArticleDTO> => {
    return this.articleRepo.get(articleId);
  };

  getAll = async (articleLimit: number = 0): Promise<ArticleLightDTO[]> => {
    return this.articleRepo.getAll(articleLimit);
  };

  save = async (articleBody: ArticleCreateDTO): Promise<ArticleDTO> => {
    return this.articleRepo.save(articleBody);
  };

  update = async (
    articleId: string,
    updates: ArticleUpdateDTO
  ): Promise<ArticleDTO> => {
    return this.articleRepo.update(articleId, updates);
  };
}
