type ArticleStatus = "draft" | "published" | "unpublished";

export type ArticleModelDoc = {
  title: string;
  body: string;
  status: ArticleStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ArticleCreateDTO = {
  title: string;
  body: string;
};

export type ArticleUpdateDTO = {
  title?: string;
  body?: string;
  status?: ArticleStatus;
};

export type ArticleDTO = {
  id: string;
  title: string;
  body: string;
  status: ArticleStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ArticleLightDTO = {
  id: string;
  title: string;
  excerpt: string;
  status: ArticleStatus;
  createdAt: Date;
};
