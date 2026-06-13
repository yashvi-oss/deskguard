export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

class Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLog(level: LogLevel, message: string, data?: any): string {
    const timestamp = this.getTimestamp();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  error(message: string, error?: any) {
    console.error(this.formatLog(LogLevel.ERROR, message, error));
  }

  warn(message: string, data?: any) {
    console.warn(this.formatLog(LogLevel.WARN, message, data));
  }

  info(message: string, data?: any) {
    console.log(this.formatLog(LogLevel.INFO, message, data));
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.formatLog(LogLevel.DEBUG, message, data));
    }
  }
}

export const logger = new Logger();
