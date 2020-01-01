import { firestore } from "firebase-admin";

export type ContactModel = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: firestore.Timestamp;
};

export type ContactSaveModel = {
  name: string;
  email: string;
  message: string;
  createdAt: firestore.FieldValue;
};

export type ConctactDTO = {
  name: string;
  email: string;
  message: string;
};
