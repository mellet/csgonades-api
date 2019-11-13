import firebaseAdmin from "firebase-admin";
import { config } from "../config/enironment";

export const makeFirestore = () => {
  const serviceAccount: firebaseAdmin.ServiceAccount = {
    clientEmail: config.firebase.clientEmail,
    privateKey: config.firebase.privateKey,
    projectId: config.firebase.projectId
  };

  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount)
  });

  const firestore = firebaseAdmin.firestore();

  return firestore;
};
