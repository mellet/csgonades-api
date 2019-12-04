import sharp from "sharp";
import { Bucket } from "@google-cloud/storage";
import nanoid from "nanoid";

type NadeImages = {
  thumbnail: string;
  large: string;
};

export interface ImageStorageService {
  saveImage(imageBase64: string): Promise<NadeImages>;
}

export const makeImageStorageService = (
  bucket: Bucket
): ImageStorageService => {
  const saveImage = async (imageBase64: string): Promise<NadeImages> => {
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

      await bucket.upload(`tmp/${thumbnailName}`, {
        public: true,
        gzip: true,
        destination: `${thumbnailName}`,
        contentType: `image/jpeg`,
        metadata: {
          contentType: `image/jpeg`,
          cacheControl: "public, max-age=31536000"
        }
      });

      await bucket.upload(`tmp/${largeName}`, {
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
        thumbnail: createPublicFileURL(bucket.name, thumbnailName),
        large: createPublicFileURL(bucket.name, largeName)
      };
    } catch (error) {
      console.error(error.message);
    }
  };

  return {
    saveImage
  };
};

function createPublicFileURL(bucketName: string, storageName: string) {
  return `https://storage.googleapis.com/${bucketName}/${encodeURIComponent(
    storageName
  )}`;
}
