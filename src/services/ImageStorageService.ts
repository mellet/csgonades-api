import { Bucket } from "@google-cloud/storage";
import * as Sentry from "@sentry/node";
import nanoid from "nanoid";
import sharp from "sharp";
import { CSGNConfig } from "../config/enironment";

export type NadeImages = {
  thumbnailId: string;
  thumbnailUrl: string;
  largeId: string;
  largeUrl: string;
};

export interface IImageStorageService {
  saveImage(imageBase64: string): Promise<NadeImages | null>;
  deleteImage(fileId: string): Promise<void>;
}

export class ImageStorageService implements IImageStorageService {
  private bucket: Bucket;
  private config: CSGNConfig;

  constructor(config: CSGNConfig, bucket: Bucket) {
    this.bucket = bucket;
    this.config = config;
  }

  async saveImage(imageBase64: string): Promise<NadeImages | null> {
    const tmpFolderLocation = this.config.isProduction ? "../tmp" : "tmp";
    try {
      const uri = imageBase64.split(";base64,").pop();

      if (!uri) {
        // TODO: Throw sensible erro
        return null;
      }

      const imgBuffer = Buffer.from(uri, "base64");
      const mimeType = imageBase64.substring(
        "data:image/".length,
        imageBase64.indexOf(";base64")
      );

      if (mimeType !== "jpeg") {
        throw new Error("Wrong image format");
      }

      const imageId = nanoid();
      const thumbnailName = `${imageId}_thumb.jpg`;
      const largeName = `${imageId}.jpg`;

      await sharp(imgBuffer)
        .resize(600, null)
        .toFile(`${tmpFolderLocation}/${thumbnailName}`);
      await sharp(imgBuffer)
        .resize(1200, null)
        .toFile(`${tmpFolderLocation}/${largeName}`);

      await this.bucket.upload(`${tmpFolderLocation}/${thumbnailName}`, {
        public: true,
        gzip: true,
        destination: `${thumbnailName}`,
        contentType: `image/jpeg`,
        metadata: {
          contentType: `image/jpeg`,
          cacheControl: "public, max-age=31536000"
        }
      });

      await this.bucket.upload(`${tmpFolderLocation}/${largeName}`, {
        public: true,
        gzip: true,
        destination: `${largeName}`,
        contentType: `image/jpeg`,
        metadata: {
          contentType: `image/jpeg`,
          cacheControl: "public, max-age=31536000"
        }
      });

      const images: NadeImages = {
        thumbnailId: thumbnailName,
        thumbnailUrl: this.createPublicFileURL(this.bucket.name, thumbnailName),
        largeId: largeName,
        largeUrl: this.createPublicFileURL(this.bucket.name, largeName)
      };

      return images;
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  async deleteImage(fileId: string) {
    try {
      const image = this.bucket.file(fileId);

      await image.delete();
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  }

  private createPublicFileURL(bucketName: string, storageName: string) {
    return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(
      storageName
    )}`;
  }
}
