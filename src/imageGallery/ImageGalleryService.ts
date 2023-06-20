import { nanoid } from "nanoid";
import sharp from "sharp";
import { CSGNConfig } from "../config/enironment";
import { Logger } from "../logger/Logger";
import { ErrorFactory } from "../utils/ErrorUtil";
import { ImageData, ImageStorageRepo } from "./ImageStorageRepo";

type ImageRepoDeps = {
  imageStorageRepo: ImageStorageRepo;
  config: CSGNConfig;
};

export type ImageCollection = "nades" | "lineup";

export class ImageRepo {
  private IMAGE_LARGE_SIZE = 1600;
  private IMAGE_MEDIUM_SIZE = 1000;
  private IMAGE_THUMB_SIZE = 500;
  private imageStorageRepo: ImageStorageRepo;
  private config: CSGNConfig;

  constructor(deps: ImageRepoDeps) {
    this.imageStorageRepo = deps.imageStorageRepo;
    this.config = deps.config;
  }

  getImagesInCollection = async (folder: ImageCollection) => {
    return this.imageStorageRepo.getImagesInCollection(folder);
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

  createLarge = async (
    imageBase64: string,
    collection: ImageCollection
  ): Promise<ImageData> => {
    return this.saveImage(imageBase64, collection, this.IMAGE_LARGE_SIZE);
  };

  createMedium = async (
    imageBase64: string,
    collection: ImageCollection
  ): Promise<ImageData> => {
    return this.saveImage(imageBase64, collection, this.IMAGE_MEDIUM_SIZE);
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

    try {
      const image = await this.imageStorageRepo.saveImage(
        tmpImage,
        imageName,
        collection
      );
      return image;
    } catch (error) {
      throw ErrorFactory.ExternalError("Failed to save image");
    }
  };

  deleteImage = async (internalPath: string): Promise<void> => {
    try {
      await this.imageStorageRepo.deleteImage(internalPath);
      return;
    } catch (error) {
      throw ErrorFactory.ExternalError("Failed to save image");
    }
  };

  deleteImageResult = async (imageRes: ImageData) => {
    try {
      const internalPath = `${imageRes.collection}/${imageRes.id}`;
      await this.imageStorageRepo.deleteImage(internalPath);
    } catch (error) {
      Logger.error("ImageGalleryService - deleteImageResult", error);
    }
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

    await sharp(imgBuffer)
      .resize(width, null)
      .jpeg({ quality: 95 })
      .toFile(imagePath);

    return imagePath;
  };
}
