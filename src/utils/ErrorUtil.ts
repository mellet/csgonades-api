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

  static Forbidden(message: string) {
    return new ErrorBadRequest(403, message);
  }
}

export const errorCatchConverter = (error: any) => {
  console.error(error);
  return {
    code: error.code || 500,
    message: error.message || "Unknown error"
  };
};
