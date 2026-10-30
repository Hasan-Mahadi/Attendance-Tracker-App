import { Response } from 'express';

/**
 * Pagination metadata included in paginated responses.
 */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Standardized API response class.
 * Provides consistent response format across all endpoints.
 */
export class ApiResponse {
  /**
   * Send a success response.
   * @param res - Express response object
   * @param data - Response payload
   * @param message - Success message
   * @param statusCode - HTTP status code (default: 200)
   */
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200
  ): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  /**
   * Send an error response.
   * @param res - Express response object
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 500)
   * @param errors - Additional error details
   */
  static error(
    res: Response,
    message = 'Internal Server Error',
    statusCode = 500,
    errors?: unknown
  ): Response {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors ? { errors } : {}),
    });
  }

  /**
   * Send a paginated success response.
   * @param res - Express response object
   * @param data - Array of items
   * @param pagination - Pagination metadata
   * @param message - Success message
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    message = 'Success'
  ): Response {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }
}
