import { firestore } from "firebase-admin";
import { ok, err, Result } from "neverthrow";
import { AppResult, AppError } from "./Common";
import { ErrorGenerator } from "./ErrorUtil";

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

export const extractFirestoreDataPoint = async <T>(
  snap: firestore.DocumentSnapshot
): AppResult<T> => {
  try {
    if (!snap.exists) {
      return ErrorGenerator.NOT_FOUND("Entity");
    }
    const data = snap.data() as T;
    return ok<T, AppError>(data);
  } catch (error) {
    console.error(error);
    return ErrorGenerator.UNKNOWN(error.message);
  }
};
