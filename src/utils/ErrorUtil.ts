import { err, Result } from "neverthrow";
import { AppError } from "./Common";
import { CustomError } from "ts-custom-error";

class ErrorNotFound extends CustomError {
  constructor(public code: number, message?: string) {
    super(message);
    this.code = code;
  }
}

class ErrorBadRequest extends CustomError {
  constructor(public code: number, message?: string) {
    super(message);
    this.code = code;
  }
}

export class ErrorFactory {
  static NotFound(message: string) {
    return new ErrorNotFound(404, message);
  }

  static BadRequest(message: string) {
    return new ErrorBadRequest(400, message);
  }
}

export const errorCatchConverter = (error: any) => {
  return {
    code: error.code || 500,
    message: error.message || "Unknown error"
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
    status: status,
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
