import { CustomError } from "ts-custom-error";

type ApiError = {
  code: number;
  message: string;
};

class CustomErr extends CustomError {
  constructor(public code: number, message?: string) {
    super(message);
    this.code = code;
  }
}

export class ErrorFactory {
  static NotFound(message: string) {
    return new CustomErr(404, message);
  }

  static BadRequest(message: string) {
    return new CustomErr(400, message);
  }

  static Forbidden(message: string) {
    return new CustomErr(403, message);
  }

  static ExternalError(message: string) {
    return new CustomErr(500, message);
  }

  static InternalServerError(message: string) {
    return new CustomErr(500, message);
  }
}

export const errorCatchConverter = (error: any): ApiError => {
  console.error(error);
  return {
    code: error.code || 500,
    message: error.message || "Unknown error"
  };
};
