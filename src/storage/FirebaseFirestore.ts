import firebaseAdmin from "firebase-admin";
import { CSGNConfig } from "../config/enironment";

export const makePersistedStorage = (config: CSGNConfig) => {
  const serviceAccount: firebaseAdmin.ServiceAccount = {
    clientEmail: config.firebase.clientEmail,
    privateKey: config.firebase.privateKey,
    projectId: config.firebase.projectId
  };

  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount)
  });

  const bucket = firebaseAdmin
    .storage()
    .bucket(`gs://${config.firebase.projectId}.appspot.com`);

  return {
    bucket
  };
};
