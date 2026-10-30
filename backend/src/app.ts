import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { env } from './config/env.js';
import { swaggerDocument } from './config/swagger.js';
import { requestId } from './middleware/requestId.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import { ApiResponse } from './utils/ApiResponse.js';

// Route modules
import authRoutes from './modules/auth/routes.js';
import employeeRoutes from './modules/employees/routes.js';
import departmentRoutes from './modules/departments/routes.js';
import attendanceRoutes from './modules/attendance/routes.js';
import leaveRoutes from './modules/leave/routes.js';
import holidayRoutes from './modules/holidays/routes.js';
import payrollRoutes from './modules/payroll/routes.js';
import performanceRoutes from './modules/performance/routes.js';
import expenseRoutes from './modules/expenses/routes.js';
import reportRoutes from './modules/reports/routes.js';
import settingRoutes from './modules/settings/routes.js';
import notificationRoutes from './modules/notifications/routes.js';
import auditRoutes from './modules/audit/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';

export function createApp(): Express {
  const app = express();

  // Disable ETag generation to prevent 304 stale caching of dynamic data
  app.set('etag', false);

  // Trust proxy for Render / Vercel reverse proxies
  app.set('trust proxy', 1);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction ? undefined : false,
    })
  );

  // CORS configuration
  const allowedOrigins = env.cors.origins && env.cors.origins.length > 0
    ? env.cors.origins
    : [env.frontend.url];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
          return callback(null, true);
        }
        return callback(new Error(`CORS blocked for origin: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  // Prevent stale caching on dynamic API responses
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // Standard middlewares
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());
  app.use(requestId);

  // HTTP request logging
  if (!env.isTest) {
    app.use(
      morgan(env.isDevelopment ? 'dev' : 'combined', {
        skip: (req) => req.url.includes('/health'),
      })
    );
  }

  // Rate Limiting for general API
  app.use('/api/', apiLimiter);

  // Root redirect to Swagger documentation
  app.get('/', (_req: Request, res: Response) => {
    res.redirect('/api/v1/docs');
  });

  // Favicon handler
  app.get('/favicon.ico', (_req: Request, res: Response) => {
    res.status(204).end();
  });

  // Health check endpoint
  app.get('/api/v1/health', (_req: Request, res: Response) => {
    ApiResponse.success(
      res,
      {
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.nodeEnv,
      },
      'AIExpertsBD Attendance Tracker API is operational'
    );
  });

  // Swagger Documentation Setup
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Mount API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/employees', employeeRoutes);
  app.use('/api/v1/departments', departmentRoutes);
  app.use('/api/v1/attendance', attendanceRoutes);
  app.use('/api/v1/leave', leaveRoutes);
  app.use('/api/v1/holidays', holidayRoutes);
  app.use('/api/v1/payroll', payrollRoutes);
  app.use('/api/v1/performance', performanceRoutes);
  app.use('/api/v1/expenses', expenseRoutes);
  app.use('/api/v1/reports', reportRoutes);
  app.use('/api/v1/settings', settingRoutes);
  app.use('/api/v1/notifications', notificationRoutes);
  app.use('/api/v1/audit-logs', auditRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);

  // 404 Handler for undefined routes
  app.use((req: Request, _res: Response, next) => {
    next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized Global Error Handler
  app.use(errorHandler);

  return app;
}
