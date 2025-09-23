import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

interface LogEntry {
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  message: string;
  args: any[];
  timestamp: Date;
  url: string;
  userAgent: string;
  sessionId?: string;
  userId?: string;
  stackTrace?: string;
}

class ConsoleLogger {
  private sessionId: string;
  private userId: string | null = null;
  private logBuffer: LogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_DELAY = 2000; // 2 seconds
  private isEnabled: boolean = false;
  private isCollecting: boolean = true; // Collect but don't send automatically
  private originalConsole: {
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
    info: typeof console.info;
    debug: typeof console.debug;
  };

  constructor() {
    this.sessionId = this.generateSessionId();

    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console)
    };
  }

  private generateSessionId(): string {
    return `console_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public enable(userId?: string): void {
    if (this.isEnabled) return;

    this.isEnabled = true;
    this.userId = userId || null;
    this.sessionId = this.generateSessionId();

    // Override console methods
    console.log = this.interceptLog('log');
    console.error = this.interceptLog('error');
    console.warn = this.interceptLog('warn');
    console.info = this.interceptLog('info');
    console.debug = this.interceptLog('debug');

    this.originalConsole.log('🎯 Console logging to Firebase enabled', {
      sessionId: this.sessionId,
      userId: this.userId
    });
  }

  public disable(): void {
    if (!this.isEnabled) return;

    // Flush any remaining logs
    this.flushLogs();

    // Restore original console methods
    console.log = this.originalConsole.log;
    console.error = this.originalConsole.error;
    console.warn = this.originalConsole.warn;
    console.info = this.originalConsole.info;
    console.debug = this.originalConsole.debug;

    this.isEnabled = false;
    this.originalConsole.log('🛑 Console logging to Firebase disabled');
  }

  private interceptLog = (level: LogEntry['level']) => {
    return (...args: any[]): void => {
      // Always call original console method
      this.originalConsole[level](...args);

      if (!this.isEnabled) return;

      try {
        // Create log entry
        const logEntry: LogEntry = {
          level,
          message: this.formatMessage(args),
          args: this.sanitizeArgs(args),
          timestamp: new Date(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          sessionId: this.sessionId,
          userId: this.userId || undefined // Keep as undefined in memory, will convert to null when sending
        };

        // Add stack trace for errors
        if (level === 'error') {
          const error = args.find(arg => arg instanceof Error);
          if (error) {
            logEntry.stackTrace = error.stack;
          } else {
            logEntry.stackTrace = new Error().stack;
          }
        }

        // Add to buffer
        this.logBuffer.push(logEntry);

        // Only auto-send if NOT in collecting mode
        if (!this.isCollecting) {
          // Start or reset batch timer
          this.scheduleBatch();

          // Immediately flush if error or buffer is full
          if (level === 'error' || this.logBuffer.length >= this.BATCH_SIZE) {
            this.flushLogs();
          }
        }
        // If collecting mode, just keep logs in buffer until explicitly sent
      } catch (error) {
        // Silently fail to avoid infinite loops
        this.originalConsole.error('Failed to log to Firebase:', error);
      }
    };
  };

  private formatMessage(args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  private sanitizeArgs(args: any[]): any[] {
    return args.map(arg => {
      try {
        // Remove sensitive data
        if (typeof arg === 'object' && arg !== null) {
          const sanitized = { ...arg };

          // Remove API keys and passwords
          Object.keys(sanitized).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('key') ||
                lowerKey.includes('password') ||
                lowerKey.includes('token') ||
                lowerKey.includes('secret')) {
              sanitized[key] = '[REDACTED]';
            }
          });

          return sanitized;
        }
        return arg;
      } catch {
        return '[SANITIZATION_ERROR]';
      }
    });
  }

  private scheduleBatch(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.flushLogs();
    }, this.BATCH_DELAY);
  }

  private async flushLogs(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      // Send logs to Firebase in batch
      const batch = {
        sessionId: this.sessionId,
        userId: this.userId || null, // Ensure null instead of undefined
        logs: logsToSend.map(log => ({
          level: log.level,
          message: log.message || '',
          args: log.args || [],
          timestamp: Timestamp.fromDate(log.timestamp),
          url: log.url || '',
          userAgent: log.userAgent || '',
          sessionId: log.sessionId || this.sessionId,
          userId: log.userId || null, // Ensure null instead of undefined
          stackTrace: log.stackTrace || null
        })),
        createdAt: serverTimestamp(),
        environment: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language
        }
      };

      await addDoc(collection(db, 'consoleLogs'), batch);

      this.originalConsole.log(`📤 Flushed ${logsToSend.length} logs to Firebase`);
    } catch (error) {
      this.originalConsole.error('Failed to send logs to Firebase:', error);

      // Re-add logs to buffer if failed (with limit to prevent memory issues)
      if (this.logBuffer.length < 100) {
        this.logBuffer = [...logsToSend, ...this.logBuffer].slice(0, 100);
      }
    }
  }

  public setUserId(userId: string): void {
    this.userId = userId;
  }

  // Send logs only when user provides feedback
  public async sendLogsWithFeedback(feedback: 'thumbs_up' | 'thumbs_down', comment?: string): Promise<void> {
    if (this.logBuffer.length === 0) {
      this.originalConsole.log('No logs to send with feedback');
      return;
    }

    const logsToSend = [...this.logBuffer];
    // Keep buffer for next session
    // this.logBuffer = [];

    try {
      const batch = {
        sessionId: this.sessionId,
        userId: this.userId || null,
        feedback,
        feedbackComment: comment || null,
        logs: logsToSend.map(log => ({
          level: log.level,
          message: log.message || '',
          args: log.args || [],
          timestamp: Timestamp.fromDate(log.timestamp),
          url: log.url || '',
          userAgent: log.userAgent || '',
          sessionId: log.sessionId || this.sessionId,
          userId: log.userId || null,
          stackTrace: log.stackTrace || null
        })),
        createdAt: serverTimestamp(),
        environment: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language
        }
      };

      await addDoc(collection(db, 'consoleLogsWithFeedback'), batch);

      this.originalConsole.log(`📤 Sent ${logsToSend.length} logs with ${feedback} feedback to Firebase`);

      // Clear buffer after successful send with feedback
      this.logBuffer = [];
    } catch (error) {
      this.originalConsole.error('Failed to send logs with feedback:', error);
    }
  }

  // Enable collecting mode (collect but don't auto-send)
  public enableCollecting(): void {
    this.isCollecting = true;
    this.enable();
  }

  // Disable collecting mode (auto-send logs)
  public disableCollecting(): void {
    this.isCollecting = false;
  }

  public async sendCriticalLog(message: string, data?: any): Promise<void> {
    try {
      await addDoc(collection(db, 'criticalLogs'), {
        sessionId: this.sessionId,
        userId: this.userId || null, // Ensure null instead of undefined
        message: message || 'No message provided',
        data: data || {},
        timestamp: serverTimestamp(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    } catch (error) {
      this.originalConsole.error('Failed to send critical log:', error);
    }
  }

  // Get session info for debugging
  public getSessionInfo(): {
    sessionId: string;
    userId: string | null;
    logsInBuffer: number;
    isEnabled: boolean;
  } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      logsInBuffer: this.logBuffer.length,
      isEnabled: this.isEnabled
    };
  }
}

// Create singleton instance
export const consoleLogger = new ConsoleLogger();

// Auto-enable in COLLECTING mode in development or when flag is set
if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_CONSOLE_LOGGING === 'true') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      consoleLogger.enableCollecting(); // Collect but don't auto-send
    });
  } else {
    consoleLogger.enableCollecting(); // Collect but don't auto-send
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  consoleLogger.disable();
});

export default consoleLogger;