import { Role } from '../config/constants.js';

/**
 * Extend the Express Request interface to include user information
 * populated by the authenticate middleware.
 */
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        /** User document _id */
        id: string;
        /** Associated Employee document _id */
        employeeId: string;
        /** User role */
        role: Role;
        /** User email */
        email: string;
      };
    }
  }
}

export {};
