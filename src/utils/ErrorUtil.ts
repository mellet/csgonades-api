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

  static FORBIDDEN(message: string) {
    const error: AppError = {
      status: 403,
      message
    };
    return err<any, AppError>(error);
  }

  static UNKNOWN(message: string) {
    const error: AppError = {
      status: 500,
      message
    };
    return err<any, AppError>(error);
  }
}
