import { Result } from "neverthrow";

export const removeUndefines = <T extends Object>(object: T): T => {
  const newObject = {
    ...object
  };
  Object.keys(newObject).forEach(
    key => newObject[key] === undefined && delete newObject[key]
  );
  return newObject;
};

export type AppError = {
  status: number;
  message: string;
};

export type AppResult<T> = Promise<Result<T, AppError>>;
