import { err } from "neverthrow";
import { AppError } from "./Common";

export const createHttpError = (message: string) => {
  return {
    error: message
  };
};

export class ErrorGenerator {
  static NOT_FOUND(entity: string) {
    const error: AppError = {
      status: 404,
      message: `${entity} was not found.`
    };
    return err<any, AppError>(error);
  }
}
