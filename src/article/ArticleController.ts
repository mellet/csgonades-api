import { Router } from "express";
import { Request, Response } from "express-serve-static-core";
import { adminOrModHandler } from "../utils/AuthUtils";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { ArticleService } from "./ArticleService";
import {
  validateArticleCreateDTO,
  validateArticleId,
  validateArticleUpdateDTO,
} from "./ArticleValidators";

export class ArticleController {
  private router: Router;
  private articleService: ArticleService;

  constructor(articleService: ArticleService) {
    this.router = Router();
    this.articleService = articleService;
    this.setUpRoutes();
  }

  setUpRoutes = () => {
    this.router.get("/articles", this.getArticles);
    this.router.post("/articles", adminOrModHandler, this.createArticle);
    this.router.get("/articles/:articleId", this.get);
    this.router.patch(
      "/articles/:articleId",
      adminOrModHandler,
      this.updateArticle
    );
  };

  getArticles = async (_: Request, res: Response) => {
    try {
      const articles = await this.articleService.getAll();

      return res.status(200).send(articles);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  get = async (req: Request, res: Response) => {
    try {
      const articleId = validateArticleId(req);

      const article = await this.articleService.get(articleId);

      return res.status(200).send(article);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  createArticle = async (req: Request, res: Response) => {
    try {
      const articleCreateDto = validateArticleCreateDTO(req);

      const article = await this.articleService.save(articleCreateDto);

      return res.status(201).send(article);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  updateArticle = async (req: Request, res: Response) => {
    try {
      const articleId = validateArticleId(req);
      const articleUpdateDto = validateArticleUpdateDTO(req);

      const article = await this.articleService.update(
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
