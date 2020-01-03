export type ContactModel = {
  name: string;
  email: string;
  message: string;
  createdAt: Date;
};

export type ContactSaveDTO = {
  name: string;
  email: string;
  message: string;
};

export type ContactDTO = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
};
