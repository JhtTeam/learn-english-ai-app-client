type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m', // green
  warn: '\x1b[33m', // yellow
  error: '\x1b[31m', // red
};

const RESET = '\x1b[0m';

class Logger {
  private enabled: boolean;
  private minLevel: LogLevel;
  private levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

  constructor() {
    this.enabled = __DEV__;
    this.minLevel = 'debug';
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return this.levels.indexOf(level) >= this.levels.indexOf(this.minLevel);
  }

  private formatMessage(level: LogLevel, tag: string, message: string): string {
    const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
    return `${
      LOG_COLORS[level]
    }[${timestamp}] [${level.toUpperCase()}] [${tag}]${RESET} ${message}`;
  }

  debug(tag: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', tag, message), ...args);
    }
  }

  info(tag: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', tag, message), ...args);
    }
  }

  warn(tag: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', tag, message), ...args);
    }
  }

  error(tag: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', tag, message), ...args);
    }
  }
}

export const logger = new Logger();
