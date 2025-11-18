/**
 * Keskitetty loggausutiliitti
 *
 * Tuotannossa näytetään vain error-tason lokit.
 * Kehityksessä näytetään kaikki tasot.
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const isDevelopment = import.meta.env.DEV;

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!isDevelopment && level !== 'error') {
      return false;
    }
    return true;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
