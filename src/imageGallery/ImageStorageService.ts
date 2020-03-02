import { Bucket } from "@google-cloud/storage";
import * as Sentry from "@sentry/node";
import { ErrorFactory } from "../utils/ErrorUtil";

export type ImageFolders = "nades" | "gallery";

export type ImageRes = {
  internalPath: string;
  url: string;
};

export class ImageStorageRepo {
  private bucket: Bucket;

  constructor(bucket: Bucket) {
    this.bucket = bucket;
  }

  getImagesInFolder = async (folder: ImageFolders): Promise<ImageRes[]> => {
    const res = await this.bucket.getFiles({ directory: folder });
    const files = res[0];

    const images: ImageRes[] = [];

    for (let file of files) {
      if (!file.id) {
        continue;
      }

      images.push({
        internalPath: file.id,
        url: this.createPublicFileURL(this.bucket.name, file.id)
      });
    }

    return images;
  };

  saveImage = async (
    imageLocalPath: string,
    fileName: string,
    imagaRemoteFolder: ImageFolders
  ): Promise<ImageRes> => {
    const imageRemotePath = `${imagaRemoteFolder}/${fileName}`;

    await this.uploadToBucket(imageLocalPath, imageRemotePath);

    const fireBaseStorageUrl = this.createPublicFileURL(
      this.bucket.name,
      imageRemotePath
    );

    return {
      internalPath: imageRemotePath,
      url: fireBaseStorageUrl
    };
  };

  async deleteImage(imagePath: string) {
    try {
      const image = this.bucket.file(imagePath);

      await image.delete();
    } catch (error) {
      Sentry.captureException(error);
      throw ErrorFactory.ExternalError("Failed to delete image.");
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
          cacheControl: "public, max-age=31536000"
        }
      });
    } catch (error) {
      Sentry.captureException(error);
      throw ErrorFactory.ExternalError("Failed to upload image.");
    }
  };

  private createPublicFileURL(bucketName: string, storageName: string) {
    return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(
      storageName
    )}`;
  }
}
