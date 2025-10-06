/**
 * Enhanced Error Handling System
 * Provides categorized errors, retry logic, and detailed logging
 */

// Error Categories
export enum ErrorType {
  VALIDATION = 'validation_error',
  NETWORK = 'network_error',
  PERMISSION = 'permission_error',
  DATABASE = 'database_error',
  API_ERROR = 'api_error',
  TIMEOUT = 'timeout_error',
  NOT_FOUND = 'not_found_error',
  RATE_LIMIT = 'rate_limit_error',
  UNKNOWN = 'unknown_error'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',      // Can retry
  MEDIUM = 'medium', // Can retry with caution
  HIGH = 'high',    // Should not retry
  CRITICAL = 'critical' // Must not retry
}

// Categorized error class
export class CategorizedError extends Error {
  public type: ErrorType;
  public severity: ErrorSeverity;
  public details: Record<string, unknown>;
  public retryable: boolean;
  public userMessage: string;
  public technicalMessage: string;

  constructor(
    type: ErrorType,
    message: string,
    details: Record<string, unknown> = {},
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    retryable: boolean = true
  ) {
    super(message);
    this.name = 'CategorizedError';
    this.type = type;
    this.severity = severity;
    this.details = details;
    this.retryable = retryable;
    this.technicalMessage = message;
    this.userMessage = this.getUserFriendlyMessage();
  }

  private getUserFriendlyMessage(): string {
    switch (this.type) {
      case ErrorType.VALIDATION:
        return `Invalid input: ${this.message}. Please check your data and try again.`;

      case ErrorType.NETWORK:
        return 'Network connection issue. Please check your internet connection and try again.';

      case ErrorType.PERMISSION:
        return 'You do not have permission to perform this action. Please contact your administrator.';

      case ErrorType.DATABASE:
        return 'Database connection issue. Our team has been notified. Please try again later.';

      case ErrorType.API_ERROR:
        return `External service error: ${this.message}. Please try again in a few moments.`;

      case ErrorType.TIMEOUT:
        return 'The operation took too long to complete. Please try again with fewer items or contact support.';

      case ErrorType.NOT_FOUND:
        return `The requested resource was not found: ${this.message}`;

      case ErrorType.RATE_LIMIT:
        return 'Too many requests. Please wait a moment before trying again.';

      default:
        return `An unexpected error occurred: ${this.message}. Please try again or contact support.`;
    }
  }
}

// Error categorization function
export function categorizeError(error: unknown): CategorizedError {
  // Already categorized
  if (error instanceof CategorizedError) {
    return error;
  }

  // Standard Error object
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return new CategorizedError(
        ErrorType.NETWORK,
        error.message,
        { originalError: error },
        ErrorSeverity.LOW,
        true
      );
    }

    // Permission errors
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return new CategorizedError(
        ErrorType.PERMISSION,
        error.message,
        { originalError: error },
        ErrorSeverity.HIGH,
        false
      );
    }

    // Validation errors
    if (message.includes('invalid') || message.includes('required') || message.includes('must be')) {
      return new CategorizedError(
        ErrorType.VALIDATION,
        error.message,
        { originalError: error },
        ErrorSeverity.MEDIUM,
        false
      );
    }

    // Database errors
    if (message.includes('firebase') || message.includes('firestore') || message.includes('database')) {
      return new CategorizedError(
        ErrorType.DATABASE,
        error.message,
        { originalError: error },
        ErrorSeverity.MEDIUM,
        true
      );
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return new CategorizedError(
        ErrorType.TIMEOUT,
        error.message,
        { originalError: error },
        ErrorSeverity.LOW,
        true
      );
    }

    // Not found errors
    if (message.includes('not found') || message.includes('404')) {
      return new CategorizedError(
        ErrorType.NOT_FOUND,
        error.message,
        { originalError: error },
        ErrorSeverity.MEDIUM,
        false
      );
    }

    // Rate limit errors
    if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
      return new CategorizedError(
        ErrorType.RATE_LIMIT,
        error.message,
        { originalError: error },
        ErrorSeverity.LOW,
        true
      );
    }
  }

  // Unknown error
  return new CategorizedError(
    ErrorType.UNKNOWN,
    error instanceof Error ? error.message : String(error),
    { originalError: error },
    ErrorSeverity.MEDIUM,
    true
  );
}

// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialDelay: 1000,  // 1 second
  maxDelay: 30000,     // 30 seconds
  backoffMultiplier: 2
};

// Sleep utility for delays
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, error: CategorizedError, delay: number) => void,
  operationName: string = 'Operation'
): Promise<T> {
  let lastError: CategorizedError | null = null;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      console.log(`🔄 ${operationName} - Attempt ${attempt}/${config.maxAttempts}`);
      return await operation();
    } catch (error) {
      lastError = categorizeError(error);

      console.error(`❌ ${operationName} - Attempt ${attempt} failed:`, {
        type: lastError.type,
        severity: lastError.severity,
        message: lastError.message,
        retryable: lastError.retryable
      });

      // Don't retry if error is not retryable or we've exhausted attempts
      if (!lastError.retryable || attempt === config.maxAttempts) {
        throw lastError;
      }

      // Calculate next delay with exponential backoff
      const currentDelay = Math.min(delay, config.maxDelay);

      // Notify about retry
      if (onRetry) {
        onRetry(attempt, lastError, currentDelay);
      }

      console.log(`⏳ ${operationName} - Waiting ${currentDelay}ms before retry...`);
      await sleep(currentDelay);

      // Increase delay for next attempt
      delay = delay * config.backoffMultiplier;
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new CategorizedError(
    ErrorType.UNKNOWN,
    `${operationName} failed after ${config.maxAttempts} attempts`,
    {},
    ErrorSeverity.HIGH,
    false
  );
}

// Error logging structure
export interface ErrorLog {
  event: 'error_occurred';
  errorType: ErrorType;
  errorSeverity: ErrorSeverity;
  errorMessage: string;
  technicalDetails: {
    stack?: string;
    functionName?: string;
    functionArgs?: unknown;
    attemptNumber?: number;
    maxAttempts?: number;
    retryable?: boolean;
  };
  userAction: string;
  aiRequestId?: string;
  timestamp: string;
}

// Create structured error log
export function createErrorLog(
  error: CategorizedError,
  context: {
    functionName?: string;
    functionArgs?: unknown;
    userAction: string;
    aiRequestId?: string;
    attemptNumber?: number;
    maxAttempts?: number;
  }
): ErrorLog {
  return {
    event: 'error_occurred',
    errorType: error.type,
    errorSeverity: error.severity,
    errorMessage: error.technicalMessage,
    technicalDetails: {
      stack: error.stack,
      functionName: context.functionName,
      functionArgs: context.functionArgs,
      attemptNumber: context.attemptNumber,
      maxAttempts: context.maxAttempts,
      retryable: error.retryable
    },
    userAction: context.userAction,
    aiRequestId: context.aiRequestId,
    timestamp: new Date().toISOString()
  };
}