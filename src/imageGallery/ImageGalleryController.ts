import { RequestHandler, Router } from "express";
import { adminOrModHandler } from "../utils/AuthUtils";
import { errorCatchConverter } from "../utils/ErrorUtil";
import { ImageCollection, ImageGalleryService } from "./ImageGalleryService";

export class ImageGalleryController {
  private router: Router;
  private imageGalleryService: ImageGalleryService;

  constructor(imageGalleryService: ImageGalleryService) {
    this.router = Router();
    this.imageGalleryService = imageGalleryService;
    this.setUpRoutes();
  }

  setUpRoutes = () => {
    this.router.get("/gallery/:collection", adminOrModHandler, this.getImages);
    this.router.post("/gallery/:collection", adminOrModHandler, this.addImage);
  };

  getImages: RequestHandler = async (req, res) => {
    try {
      const collection = req.params.collection as ImageCollection;
      const images = await this.imageGalleryService.getImagesInCollection(
        collection
      );

      return res.status(200).send(images);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  addImage: RequestHandler = async (req, res) => {
    const base64image = req.body.image;

    try {
      const result = await this.imageGalleryService.createLarge(
        base64image,
        "articles"
      );
      return res.status(200).send(result);
    } catch (error) {
      const err = errorCatchConverter(error);
      return res.status(err.code).send(err);
    }
  };

  getRouter = (): Router => {
    return this.router;
  };
}
