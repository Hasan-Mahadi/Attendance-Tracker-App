/**
 * Custom API error class with common factory methods.
 * Extends the native Error class with HTTP status codes and structured error details.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: Record<string, string>[];

  constructor(
    message: string,
    statusCode: number,
    isOperational = true,
    errors?: Record<string, string>[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, new.target.prototype);

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /** 400 Bad Request */
  static badRequest(message = 'Bad Request'): ApiError {
    return new ApiError(message, 400);
  }

  /** 401 Unauthorized */
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(message, 401);
  }

  /** 403 Forbidden */
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(message, 403);
  }

  /** 404 Not Found */
  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(message, 404);
  }

  /** 409 Conflict */
  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(message, 409);
  }

  /** 500 Internal Server Error */
  static internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(message, 500, false);
  }

  /**
   * 422 Validation Error with field-level detail.
   * @param errors - Array of field-level error objects
   */
  static validationError(
    errors: Record<string, string>[],
    message = 'Validation failed'
  ): ApiError {
    return new ApiError(message, 422, true, errors);
  }
}
