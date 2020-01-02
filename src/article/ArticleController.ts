import { Router, RequestHandler } from "express";
import { ArticleRepo } from "./ArticleRepo";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { adminOrModeratorRouter } from "../utils/AuthUtils";
import {
  validateArticleUpdateDTO,
  validateArticleId,
  validateArticleCreateDTO
} from "./ArticleValidators";

export class ArticleController {
  private router: Router;
  private articleRepo: ArticleRepo;

  constructor(articleRepo: ArticleRepo) {
    this.router = Router();
    this.articleRepo = articleRepo;
    this.setUpRoutes();
  }

  setUpRoutes = () => {
    this.router.get("/articles", this.getArticles);
    this.router.post("/articles", adminOrModeratorRouter, this.createArticle);
    this.router.get("/articles/:articleId", this.get);
    this.router.patch(
      "/articles/:articleId",
      adminOrModeratorRouter,
      this.updateArticle
    );
  };

  getArticles: RequestHandler = async (_, res) => {
    try {
      const articles = await this.articleRepo.getAll();

      return res.status(200).send(articles);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  get: RequestHandler = async (req, res) => {
    try {
      const articleId = validateArticleId(req);

      const article = await this.articleRepo.get(articleId);

      return res.status(200).send(article);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  createArticle: RequestHandler = async (req, res) => {
    try {
      const articleCreateDto = validateArticleCreateDTO(req.body);

      const article = await this.articleRepo.save(articleCreateDto);

      return res.status(201).send(article);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  updateArticle: RequestHandler = async (req, res) => {
    try {
      const articleId = validateArticleId(req);
      const articleUpdateDto = validateArticleUpdateDTO(req);

      const article = await this.articleRepo.update(
        articleId,
        articleUpdateDto
      );

      return res.status(202).send(article);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  getRouter = (): Router => {
    return this.router;
  };
}
