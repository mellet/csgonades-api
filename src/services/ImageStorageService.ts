import { Bucket } from "@google-cloud/storage";
import * as Sentry from "@sentry/node";
import nanoid from "nanoid";
import sharp from "sharp";
import { CSGNConfig } from "../config/enironment";
import { ErrorFactory } from "../utils/ErrorUtil";

export type NadeImages = {
  thumbnailId: string;
  thumbnailUrl: string;
};

type ImageUploadResult = {
  id: string;
  url: string;
};

export interface IImageStorageService {
  saveImage(
    imageBase64: string,
    bucketFolder: string
  ): Promise<ImageUploadResult>;
  deleteImage(fileId: string): Promise<void>;
}

export class ImageStorageRepo implements IImageStorageService {
  private bucket: Bucket;
  private config: CSGNConfig;

  constructor(config: CSGNConfig, bucket: Bucket) {
    this.bucket = bucket;
    this.config = config;
  }

  listImagesInFolder = async (folder?: string) => {
    const res = await this.bucket.getFiles({ directory: folder });
    const files = res[0];

    const large: string[] = [];
    const thumbs: string[] = [];

    for (let file of files) {
      if (!file.id) {
        continue;
      }
      if (file.id.includes("thumb")) {
        thumbs.push(file.id);
      } else {
        large.push(file.id);
      }
    }

    return {
      large,
      thumbs
    };
  };

  saveImage = async (
    imageBase64: string,
    bucketFolder: string
  ): Promise<ImageUploadResult> => {
    const { fileName, folder } = await this.imageTransform(imageBase64);

    const bucketPathAndName = `${bucketFolder}/${fileName}`;

    await this.uploadToBucket(`${folder}/${fileName}`, bucketPathAndName);

    const fireBaseStorageUrl = this.createPublicFileURL(
      this.bucket.name,
      bucketPathAndName
    );

    return {
      id: fileName,
      url: fireBaseStorageUrl
    };
  };

  private imageTransform = async (base64Image: string) => {
    const tmpFolderLocation = this.config.isProduction ? "../tmp" : "tmp";
    const uri = base64Image.split(";base64,").pop();

    if (!uri) {
      throw ErrorFactory.BadRequest("Failed to process image");
    }

    const imgBuffer = Buffer.from(uri, "base64");

    const mimeType = base64Image.substring(
      "data:image/".length,
      base64Image.indexOf(";base64")
    );

    if (mimeType !== "jpeg") {
      throw ErrorFactory.BadRequest("Wrong image format, only JPG supported.");
    }

    const imageId = nanoid();
    const fileName = `${imageId}_thumb.jpg`;

    await sharp(imgBuffer)
      .resize(1080, null)
      .jpeg()
      .toFile(`${tmpFolderLocation}/${fileName}`);

    return {
      folder: tmpFolderLocation,
      fileName: fileName
    };
  };

  private uploadToBucket = async (
    imagePath: string,
    fullFilePathAndName: string
  ) => {
    try {
      await this.bucket.upload(imagePath, {
        public: true,
        gzip: true,
        destination: `${fullFilePathAndName}`,
        contentType: `image/jpeg`,
        metadata: {
          contentType: `image/jpeg`,
          cacheControl: "public, max-age=31536000"
        }
      });
    } catch (error) {
      Sentry.captureException(error);
      throw ErrorFactory.ExternalError("Failed to upload image.");
    }
  };

  async deleteImage(fileId: string) {
    try {
      const image = this.bucket.file(fileId);

      await image.delete();
    } catch (error) {
      Sentry.captureException(error);
      throw ErrorFactory.ExternalError("Failed to delete image.");
    }
  }

  private createPublicFileURL(bucketName: string, storageName: string) {
    return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(
      storageName
    )}`;
  }
}
