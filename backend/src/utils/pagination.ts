import { PaginationMeta } from './ApiResponse.js';

/** Default pagination values */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parsed pagination parameters from query string.
 */
export interface PaginationQuery {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

/**
 * Parse pagination-related query parameters from the request query.
 * @param query - Express request query object
 * @returns Parsed pagination parameters with defaults
 */
export function parsePaginationQuery(
  query: Record<string, unknown>
): PaginationQuery {
  const page = Math.max(1, parseInt(String(query.page || DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(query.limit || DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const skip = (page - 1) * limit;

  // Parse sort: "field:asc,field2:desc" or "-field" format
  const sort: Record<string, 1 | -1> = {};
  const sortParam = query.sort;

  if (typeof sortParam === 'string' && sortParam.trim()) {
    const parts = sortParam.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes(':')) {
        const [field, direction] = trimmed.split(':');
        if (field) {
          sort[field.trim()] = direction?.trim().toLowerCase() === 'desc' ? -1 : 1;
        }
      } else if (trimmed.startsWith('-')) {
        sort[trimmed.slice(1)] = -1;
      } else {
        sort[trimmed] = 1;
      }
    }
  }

  // Default sort by createdAt descending
  if (Object.keys(sort).length === 0) {
    sort.createdAt = -1;
  }

  return { page, limit, skip, sort };
}

/**
 * Build pagination metadata from query results.
 * @param total - Total number of matching documents
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Pagination metadata object
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
