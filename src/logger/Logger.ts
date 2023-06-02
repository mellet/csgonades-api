enum LogLevel {
  verbose = 0,
  info = 1,
  warning = 2,

  error = 3,
}

const LOG_LEVEL: LogLevel =
  process.env.NODE_ENV === "development" ? LogLevel.verbose : LogLevel.info;

export class Logger {
  static verbose(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "TEST" || LOG_LEVEL > LogLevel.verbose) {
      return;
    }

    console.log("VERBOSE |", message, ...optionalParams);
  }

  static info(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "TEST" || LOG_LEVEL > LogLevel.info) {
      return;
    }

    console.log("INFO |", message, ...optionalParams);
  }

  static warning(message?: any, ...optionalParams: any[]) {
    if (process.env.NODE_ENV === "TEST" || LOG_LEVEL > LogLevel.warning) {
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
