import { ImageRes } from "../imageGallery/ImageStorageService";

type ArticleStatus = "draft" | "published" | "unpublished";

export type ArticleModelDoc = {
  title: string;
  slug: string;
  body: string;
  status: ArticleStatus;
  images: {
    thumbnail: ImageRes;
    large: ImageRes;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type ArticleCreateDTO = {
  title: string;
  images: {
    thumbnail: ImageRes;
    large: ImageRes;
  };
  body: string;
};

export type ArticleCreateBodyDTO = {
  title: string;
  body: string;
  imageBase64Data: string;
};

export type ArticleUpdateDTO = {
  title?: string;
  body?: string;
  status?: ArticleStatus;
};

export type ArticleDTO = {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: ArticleStatus;
  images: {
    thumbnail: ImageRes;
    large: ImageRes;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type ArticleLightDTO = {
  id: string;
  title: string;
  slug: string;
  status: ArticleStatus;
  images: {
    thumbnail: ImageRes;
    large: ImageRes;
  };
  createdAt: Date;
  updatedAt: Date;
};
