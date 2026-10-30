import http from 'http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Create Express app
    const app = createApp();
    const server = http.createServer(app);

    // 3. Start HTTP server
    server.listen(env.port, () => {
      logger.info(`🚀 Attendance Tracker Backend running on port ${env.port}`);
      logger.info(`🌐 Environment: ${env.nodeEnv}`);
      logger.info(`📖 API Docs available at http://localhost:${env.port}/api/v1/docs`);
    });

    // 4. Graceful Shutdown Handlers
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed.');
        try {
          await disconnectDatabase();
          logger.info('Database disconnected.');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown', { error: (err as Error).message });
          process.exit(1);
        }
      });

      // Force shutdown after 10s timeout
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
}

bootstrap();
