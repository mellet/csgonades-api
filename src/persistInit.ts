import { Bucket } from "@google-cloud/storage";
import { CSGNConfig } from "./config/enironment";
import { makePersistedStorage } from "./storage/FirebaseFirestore";

export interface PersistedStorage {
  bucket: Bucket;
  db: FirebaseFirestore.Firestore;
}

export function persistInit(config: CSGNConfig): PersistedStorage {
  const persistedStorage = makePersistedStorage(config);
  return persistedStorage;
}
