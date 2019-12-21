import { firestore } from "firebase-admin";
import { ok, err, Result } from "neverthrow";
import { AppResult, AppError } from "./Common";

export const extractFirestoreData = async <T>(
  snap: firestore.QuerySnapshot
): AppResult<T[]> => {
  let data: T[] = [];
  snap.forEach(dataDoc => {
    const dataPoint = dataDoc.data() as any;
    data.push(dataPoint);
  });

  const test = ok<T[], AppError>(data);
  return test;
};
