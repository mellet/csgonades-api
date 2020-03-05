type ArticleStatus = "draft" | "published" | "unpublished";

export type ArticleModelDoc = {
  title: string;
  slug: string;
  body: string;
  status: ArticleStatus;
  images: {
    thumbnailUrl: string;
    largeUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type ArticleCreateDTO = {
  title: string;
  thumbnailImagelUrl: string;
  largeImageUrl: string;
  body: string;
};

export type ArticleUpdateDTO = {
  title?: string;
  body?: string;
  status?: ArticleStatus;
  thumbnailImagelUrl?: string;
  largeImageUrl?: string;
};

export type ArticleDTO = {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: ArticleStatus;
  images: {
    thumbnailUrl: string;
    largeUrl: string;
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
    thumbnailUrl: string;
    largeUrl: string;
  };
  createdAt: Date;
  updatedAt: Date;
};
