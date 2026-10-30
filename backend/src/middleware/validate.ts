import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodType } from 'zod';
import { ApiError } from '../utils/ApiError.js';

/**
 * Schema definition for request validation.
 * Supports validating body, query, and params independently.
 */
interface ValidationSchema {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Request validation middleware factory.
 * Validates request body, query params, and/or route params against Zod schemas.
 * Accepts either a ZodType directly (validating req.body) or a ValidationSchema object.
 *
 * @param schema - Zod schema or object containing Zod schemas for body, query, and/or params
 * @returns Express middleware function
 *
 * @example
 * router.post('/users', validate(createUserSchema), handler);
 * router.get('/users', validate({ query: listUserQuerySchema }), handler);
 */
export function validate(schema: ValidationSchema | ZodType) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('_def' in schema) {
        req.body = await (schema as ZodType).parseAsync(req.body);
      } else {
        const valSchema = schema as ValidationSchema;
        if (valSchema.body) {
          req.body = await valSchema.body.parseAsync(req.body);
        }

        if (valSchema.query) {
          req.query = (await valSchema.query.parseAsync(req.query)) as typeof req.query;
        }

        if (valSchema.params) {
          req.params = (await valSchema.params.parseAsync(req.params)) as typeof req.params;
        }
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));

        next(ApiError.validationError(errors));
        return;
      }

      next(error);
    }
  };
}
