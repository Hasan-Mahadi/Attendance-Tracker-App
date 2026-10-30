import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/** Maximum number of connection retry attempts */
const MAX_RETRIES = 5;
/** Delay between retry attempts in milliseconds */
const RETRY_DELAY_MS = 5000;

/**
 * Connect to MongoDB with retry logic.
 * Retries up to MAX_RETRIES times with exponential backoff.
 */
export async function connectDatabase(retryCount = 0): Promise<void> {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.mongodb.uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      logger.warn(
        `⚠️ MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}). Retrying in ${delay / 1000}s...`,
        { error: err.message }
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDatabase(retryCount + 1);
    }

    logger.error('❌ MongoDB connection failed after maximum retries', {
      error: err.message,
    });
    throw err;
  }
}

/**
 * Gracefully disconnect from MongoDB.
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('🔌 MongoDB disconnected gracefully');
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('❌ Error during MongoDB disconnect', {
      error: err.message,
    });
    throw err;
  }
}

// Connection event logging
mongoose.connection.on('connected', () => {
  logger.info('📡 Mongoose connected to database');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('📡 Mongoose disconnected from database');
});

mongoose.connection.on('error', (err) => {
  logger.error('📡 Mongoose connection error', { error: err.message });
});

mongoose.connection.on('reconnected', () => {
  logger.info('📡 Mongoose reconnected to database');
});
