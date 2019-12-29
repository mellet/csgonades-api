import sharp from "sharp";
import { Bucket } from "@google-cloud/storage";
import nanoid from "nanoid";
import { CSGNConfig } from "../config/enironment";
import { storage } from "firebase-admin";

export type NadeImages = {
  thumbnailId: string;
  thumbnailUrl: string;
  largeId: string;
  largeUrl: string;
};

export interface IImageStorageService {
  saveImage(imageBase64: string): Promise<NadeImages>;
  deleteImage(fileId: string): Promise<boolean>;
}

export class ImageStorageService implements IImageStorageService {
  private bucket: Bucket;

  constructor(config: CSGNConfig, bucket: Bucket) {
    this.bucket = bucket;
  }

  async saveImage(imageBase64: string): Promise<NadeImages> {
    try {
      const uri = imageBase64.split(";base64,").pop();
      const imgBuffer = Buffer.from(uri, "base64");
      const mimeType = imageBase64.substring(
        "data:image/".length,
        imageBase64.indexOf(";base64")
      );

      if (mimeType !== "jpeg") {
        throw new Error("Only jpeg is supported for images");
      }

      const imageId = nanoid();
      const thumbnailName = `${imageId}_thumb.jpg`;
      const largeName = `${imageId}.jpg`;

      await sharp(imgBuffer)
        .resize(400, null)
        .toFile(`tmp/${thumbnailName}`);
      await sharp(imgBuffer)
        .resize(1000, null)
        .toFile(`tmp/${largeName}`);

      await this.bucket.upload(`tmp/${thumbnailName}`, {
        public: true,
        gzip: true,
        destination: `${thumbnailName}`,
        contentType: `image/jpeg`,
        metadata: {
          contentType: `image/jpeg`,
          cacheControl: "public, max-age=31536000"
        }
      });

      await this.bucket.upload(`tmp/${largeName}`, {
        public: true,
        gzip: true,
        destination: `${largeName}`,
        contentType: `image/jpeg`,
        metadata: {
          contentType: `image/jpeg`,
          cacheControl: "public, max-age=31536000"
        }
      });
      return {
        thumbnailId: thumbnailName,
        thumbnailUrl: this.createPublicFileURL(this.bucket.name, thumbnailName),
        largeId: largeName,
        largeUrl: this.createPublicFileURL(this.bucket.name, largeName)
      };
    } catch (error) {
      console.error(error.message);
    }
  }

  async deleteImage(fileId: string) {
    try {
      const image = this.bucket.file(fileId);

      await image.delete();
      return true;
    } catch (error) {
      console.error("Failed to delete image", error);
      return false;
    }
  }

  private createPublicFileURL(bucketName: string, storageName: string) {
    return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(
      storageName
    )}`;
  }

  private getFileNameFromUrl(url: string) {
    url.split("/");
  }
}
