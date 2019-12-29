import { err, Result } from "neverthrow";
import { AppError } from "./Common";

export const createHttpError = (message: string) => {
  return {
    error: message
  };
};

export const makeError = (
  status: number,
  message: string
): Result<any, AppError> => {
  const error: AppError = {
    status,
    message
  };
  return err(error);
};

export const extractError = (error: any): Result<any, AppError> => {
  let message: string = "Unknow error";
  let status: number = 500;

  console.error(error);

  if (error?.message) {
    message = error.message;
  }

  const appError: AppError = {
    status: status || 500,
    message: message
  };

  return err(appError);
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
