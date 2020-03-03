import { ImageGalleryService } from "../imageGallery/ImageGalleryService";
import {
  ArticleCreateBodyDTO,
  ArticleDTO,
  ArticleLightDTO,
  ArticleUpdateDTO
} from "./Article";
import { ArticleRepo } from "./ArticleRepo";

type ArticleServiceDeps = {
  articleRepo: ArticleRepo;
  galleryService: ImageGalleryService;
};

export class ArticleService {
  private articleRepo: ArticleRepo;
  private galleryService: ImageGalleryService;

  constructor(deps: ArticleServiceDeps) {
    this.articleRepo = deps.articleRepo;
    this.galleryService = deps.galleryService;
  }

  get = async (articleId: string): Promise<ArticleDTO> => {
    return this.articleRepo.get(articleId);
  };

  getAll = async (articleLimit: number = 0): Promise<ArticleLightDTO[]> => {
    return this.articleRepo.getAll(articleLimit);
  };

  save = async (articleBody: ArticleCreateBodyDTO): Promise<ArticleDTO> => {
    const thumbnail = await this.galleryService.createThumbnail(
      articleBody.imageBase64Data,
      "articles"
    );
    const large = await this.galleryService.createLarge(
      articleBody.imageBase64Data,
      "articles"
    );

    return this.articleRepo.save({
      title: articleBody.title,
      body: articleBody.body,
      images: {
        large,
        thumbnail
      }
    });
  };

  update = async (
    articleId: string,
    updates: ArticleUpdateDTO
  ): Promise<ArticleDTO> => {
    return this.articleRepo.update(articleId, updates);
  };
}
