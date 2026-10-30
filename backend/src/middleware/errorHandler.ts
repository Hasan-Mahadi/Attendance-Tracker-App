// import { Request, Response, NextFunction } from 'express';
// import { Error as MongooseError } from 'mongoose';
// import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
// import { ZodError } from 'zod';
// import { ApiError } from '../utils/ApiError.js';
// import { logger } from '../utils/logger.js';
// import { env } from '../config/env.js';

// /**
//  * Global error handler middleware.
//  * Handles known error types and returns structured error responses.
//  * Does not leak stack traces in production.
//  */
// export function errorHandler(
//   err: Error,
//   req: Request,
//   res: Response,
//   _next: NextFunction
// ): void {
//   const requestId = req.requestId;

//   // Log the error
//   logger.error('Error caught by global handler', {
//     requestId,
//     message: err.message,
//     stack: env.isProduction ? undefined : err.stack,
//     path: req.path,
//     method: req.method,
//   });

//   // ApiError — our own custom errors
//   if (err instanceof ApiError) {
//     res.status(err.statusCode).json({
//       success: false,
//       message: err.message,
//       ...(err.errors && { errors: err.errors }),
//       ...(env.isDevelopment && { stack: err.stack }),
//     });
//     return;
//   }

//   // Mongoose Validation Error
//   if (err instanceof MongooseError.ValidationError) {
//     const errors = Object.entries(err.errors).map(([field, e]) => ({
//       field,
//       message: e.message,
//     }));
//     res.status(422).json({
//       success: false,
//       message: 'Validation failed',
//       errors,
//     });
//     return;
//   }

//   // Mongoose Cast Error (invalid ObjectId, etc.)
//   if (err instanceof MongooseError.CastError) {
//     res.status(400).json({
//       success: false,
//       message: `Invalid value for ${err.path}: ${err.value}`,
//     });
//     return;
//   }

//   // MongoDB Duplicate Key Error
//   if (err.name === 'MongoServerError' && (err as unknown as { code: number }).code === 11000) {
//     const keyValue = (err as unknown as { keyValue: Record<string, unknown> }).keyValue;
//     const field = Object.keys(keyValue || {})[0] || 'field';
//     res.status(409).json({
//       success: false,
//       message: `Duplicate value for '${field}'. This value already exists.`,
//     });
//     return;
//   }

//   // JWT Token Expired Error
//   if (err instanceof TokenExpiredError) {
//     res.status(401).json({
//       success: false,
//       message: 'Token has expired',
//     });
//     return;
//   }

//   // JWT Generic Error
//   if (err instanceof JsonWebTokenError) {
//     res.status(401).json({
//       success: false,
//       message: 'Invalid token',
//     });
//     return;
//   }

//   // Zod Validation Error
//   if (err instanceof ZodError) {
//     const errors = err.errors.map((e) => ({
//       field: e.path.join('.'),
//       message: e.message,
//     }));
//     res.status(422).json({
//       success: false,
//       message: 'Validation failed',
//       errors,
//     });
//     return;
//   }

//   // Fallback: unknown errors
//   res.status(500).json({
//     success: false,
//     message: env.isProduction ? 'Internal Server Error' : err.message,
//     ...(env.isDevelopment && { stack: err.stack }),
//   });
// }

import { Request, Response, NextFunction } from "express";
import { Error as MongooseError } from "mongoose";
import jwt from "jsonwebtoken";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

const { JsonWebTokenError, TokenExpiredError } = jwt;

/**
 * Global error handler middleware.
 * Handles known error types and returns structured error responses.
 * Does not leak stack traces in production.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = req.requestId;

  const isClientError = err instanceof ApiError && err.statusCode < 500;

  // Log client warnings (4xx) without stack trace, server errors (5xx) with full stack
  if (isClientError) {
    logger.warn(`[${err.statusCode}] ${err.message}`, {
      requestId,
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error("Error caught by global handler", {
      requestId,
      message: err.message,
      stack: env.isProduction ? undefined : err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // ApiError — our own custom errors
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && { errors: err.errors }),
      ...(env.isDevelopment && { stack: err.stack }),
    });
    return;
  }

  // Mongoose Validation Error
  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.entries(err.errors).map(([field, e]) => ({
      field,
      message: e.message,
    }));

    res.status(422).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  // Mongoose Cast Error
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}: ${err.value}`,
    });
    return;
  }

  // MongoDB Duplicate Key Error
  if (
    err.name === "MongoServerError" &&
    (err as unknown as { code: number }).code === 11000
  ) {
    const keyValue = (
      err as unknown as {
        keyValue: Record<string, unknown>;
      }
    ).keyValue;

    const field = Object.keys(keyValue || {})[0] || "field";

    res.status(409).json({
      success: false,
      message: `Duplicate value for '${field}'. This value already exists.`,
    });
    return;
  }

  // JWT Token Expired Error
  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      success: false,
      message: "Token has expired",
    });
    return;
  }

  // JWT Generic Error
  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
    return;
  }

  // Zod Validation Error
  if (err instanceof ZodError) {
    const errors = err.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));

    res.status(422).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  // Fallback: unknown errors
  res.status(500).json({
    success: false,
    message: env.isProduction ? "Internal Server Error" : err.message,
    ...(env.isDevelopment && { stack: err.stack }),
  });
}
