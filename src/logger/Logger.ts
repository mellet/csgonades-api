type LogLevel = "verbose" | "warning" | "error";

const LOG_LEVEL: LogLevel =
  process.env.NODE_ENV === "development" ? "verbose" : "warning";

export class Logger {
  static verbose(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "TEST") {
      return;
    }
    if (LOG_LEVEL === "warning" || LOG_LEVEL === "error") {
      return;
    }
    console.log("VERBOSE |", message, ...optionalParams);
  }

  static warning(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "TEST") {
      return;
    }
    if (LOG_LEVEL === "error") {
      return;
    }
    console.warn("WARN |", message, ...optionalParams);
  }

  static error(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "TEST") {
      return;
    }
    console.error("ERROR |", message, ...optionalParams);
  }
}
