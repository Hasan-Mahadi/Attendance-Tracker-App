import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID middleware.
 * Attaches a unique UUID to each incoming request and adds it to response headers.
 * Uses an existing X-Request-ID header if provided, otherwise generates a new one.
 */
export function requestId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id =
    (req.headers['x-request-id'] as string) || uuidv4();

  // Attach to request for use in logging and downstream middleware
  req.requestId = id;

  // Add to response headers
  res.setHeader('X-Request-ID', id);

  next();
}
