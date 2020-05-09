import nanoid from "nanoid";
import sharp from "sharp";
import { CSGNConfig } from "../config/enironment";
import { ErrorFactory } from "../utils/ErrorUtil";
import { ImageStorageRepo } from "./ImageStorageService";

type ImageGalleryDeps = {
  imageRepo: ImageStorageRepo;
  config: CSGNConfig;
};

export type ImageCollection = "nades" | "lineup";

export class ImageGalleryService {
  private IMAGE_LARGE_SIZE = 1240;
  private IMAGE_THUMB_SIZE = 620;
  private imageRepo: ImageStorageRepo;
  private config: CSGNConfig;

  constructor(deps: ImageGalleryDeps) {
    this.imageRepo = deps.imageRepo;
    this.config = deps.config;
  }

  getImagesInCollection = async (folder: ImageCollection) => {
    return this.imageRepo.getImagesInCollection(folder);
  };

  createThumbnail = async (
    imageBase64: string,
    collection: ImageCollection
  ) => {
    return this.saveImage(
      imageBase64,
      collection,
      this.IMAGE_THUMB_SIZE,
      "_thumb"
    );
  };

  createLarge = async (imageBase64: string, collection: ImageCollection) => {
    return this.saveImage(imageBase64, collection, this.IMAGE_LARGE_SIZE);
  };

  private saveImage = async (
    imageBase64: string,
    collection: ImageCollection,
    size: number,
    suffix?: string
  ) => {
    const imageId = nanoid();
    const imageName = suffix ? `${imageId}${suffix}.jpg` : `${imageId}.jpg`;

    const tmpImage = await this.resizeImage(imageBase64, imageName, size);

    const image = await this.imageRepo.saveImage(
      tmpImage,
      imageName,
      collection
    );

    return image;
  };

  deleteImage = (internalPath: string): Promise<void> => {
    return this.imageRepo.deleteImage(internalPath);
  };

  private resizeImage = async (
    base64image: string,
    imageName: string,
    width: number
  ): Promise<string> => {
    const tmpFolderLocation = this.config.isProduction ? "../tmp" : "tmp";
    const uri = base64image.split(";base64,").pop();

    if (!uri) {
      throw ErrorFactory.BadRequest("Failed to process image");
    }

    const imgBuffer = Buffer.from(uri, "base64");

    const mimeType = base64image.substring(
      "data:image/".length,
      base64image.indexOf(";base64")
    );

    if (mimeType !== "jpeg") {
      throw ErrorFactory.BadRequest("Wrong image format, only JPG supported.");
    }

    const fileName = `${imageName}.jpg`;
    const imagePath = `${tmpFolderLocation}/${fileName}`;

    await sharp(imgBuffer).resize(width, null).jpeg().toFile(imagePath);

    return imagePath;
  };
}
