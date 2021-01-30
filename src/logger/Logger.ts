export class Logger {
  static verbose(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "TEST") {
      return;
    }
    console.log(message, ...optionalParams);
  }

  static warning(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "TEST") {
      return;
    }
    console.warn(message, ...optionalParams);
  }

  static error(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "TEST") {
      return;
    }
    console.error(message, ...optionalParams);
  }
}
