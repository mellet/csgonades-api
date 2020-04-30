import { Bucket } from "@google-cloud/storage";
import * as Sentry from "@sentry/node";
import { ErrorFactory } from "../utils/ErrorUtil";
import { ImageCollection } from "./ImageGalleryService";

export type ImageRes = {
  id: string;
  collection: string;
  url: string;
};

export class ImageStorageRepo {
  private bucket: Bucket;

  constructor(bucket: Bucket) {
    this.bucket = bucket;
  }

  getImagesInCollection = async (
    collection: ImageCollection
  ): Promise<ImageRes[]> => {
    const res = await this.bucket.getFiles({ directory: collection });
    const files = res[0];

    const images: ImageRes[] = [];

    for (let file of files) {
      if (!file.id) {
        continue;
      }

      const [fileCollection, fileId] = file.name.split("/");

      images.push({
        id: fileId,
        collection: fileCollection,
        url: this.createPublicFileURL(this.bucket.name, fileId, fileCollection),
      });
    }

    return images;
  };

  saveImage = async (
    imageLocalPath: string,
    fileName: string,
    collection: ImageCollection
  ): Promise<ImageRes> => {
    const imageRemotePath = `${collection}/${fileName}`;

    await this.uploadToBucket(imageLocalPath, imageRemotePath);

    const fireBaseStorageUrl = this.createPublicFileURL(
      this.bucket.name,
      fileName,
      collection
    );

    return {
      id: fileName,
      collection: collection,
      url: fireBaseStorageUrl,
    };
  };

  async deleteImage(imagePath: string) {
    try {
      const path = imagePath.includes("/") ? imagePath : `nades/${imagePath}`;
      const image = this.bucket.file(path);
      await image.delete();
    } catch (error) {
      try {
        const image = this.bucket.file(imagePath);
        await image.delete();
      } catch (error) {
        Sentry.captureException(error);
        throw ErrorFactory.ExternalError("Failed to delete image.");
      }
    }
  }

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
          cacheControl: "public, max-age=31536000",
        },
      });
    } catch (error) {
      Sentry.captureException(error);
      throw ErrorFactory.ExternalError("Failed to upload image.");
    }
  };

  private createPublicFileURL(
    bucketName: string,
    imageId: string,
    collection?: string
  ) {
    if (collection) {
      return `https://storage.googleapis.com/${bucketName}/${collection}/${encodeURIComponent(
        imageId
      )}`;
    }

    return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(
      imageId
    )}`;
  }
}
