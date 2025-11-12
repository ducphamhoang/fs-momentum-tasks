/**
 * Domain Error Types for Task Provider Operations
 *
 * These error classes represent business-level failures in external task providers.
 * They are part of the domain layer and are thrown by TaskProvider implementations.
 */

/**
 * Base error class for all sync-related errors
 */
export class SyncError extends Error {
  constructor(message: string, public readonly provider?: string) {
    super(message);
    this.name = "SyncError";
    Object.setPrototypeOf(this, SyncError.prototype);
  }
}

/**
 * Error thrown when OAuth token is expired or invalid
 */
export class ProviderAuthError extends SyncError {
  constructor(message: string, provider?: string) {
    super(message, provider);
    this.name = "ProviderAuthError";
    Object.setPrototypeOf(this, ProviderAuthError.prototype);
  }
}

/**
 * Error thrown when API quota/rate limit is exceeded
 */
export class ProviderRateLimitError extends SyncError {
  constructor(
    message: string,
    provider?: string,
    public readonly retryAfter?: number
  ) {
    super(message, provider);
    this.name = "ProviderRateLimitError";
    Object.setPrototypeOf(this, ProviderRateLimitError.prototype);
  }
}

/**
 * Error thrown when network connection fails
 */
export class ProviderConnectionError extends SyncError {
  constructor(
    message: string,
    provider?: string,
    public readonly originalError?: Error
  ) {
    super(message, provider);
    this.name = "ProviderConnectionError";
    Object.setPrototypeOf(this, ProviderConnectionError.prototype);
  }
}

/**
 * Error thrown when merge conflict occurs during sync
 */
export class ConflictError extends SyncError {
  constructor(
    message: string,
    provider?: string,
    public readonly localVersion?: any,
    public readonly remoteVersion?: any
  ) {
    super(message, provider);
    this.name = "ConflictError";
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error thrown when task is not found on external platform
 */
export class TaskNotFoundError extends SyncError {
  constructor(message: string, provider?: string, public readonly taskId?: string) {
    super(message, provider);
    this.name = "TaskNotFoundError";
    Object.setPrototypeOf(this, TaskNotFoundError.prototype);
  }
}

/**
 * Error thrown when provider operation fails due to invalid data
 */
export class ProviderValidationError extends SyncError {
  constructor(
    message: string,
    provider?: string,
    public readonly validationErrors?: Record<string, string>
  ) {
    super(message, provider);
    this.name = "ProviderValidationError";
    Object.setPrototypeOf(this, ProviderValidationError.prototype);
  }
}
