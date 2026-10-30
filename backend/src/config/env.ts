import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Environment variable validation schema.
 * All required env vars are validated at startup.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),

  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().optional(),

  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(6).optional(),
  SEED_ADMIN_EMPLOYEE_CODE: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.format());
  process.exit(1);
}

/** Typed, validated environment configuration */
export const env = Object.freeze({
  nodeEnv: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',
  isTest: parsed.data.NODE_ENV === 'test',

  mongodb: {
    uri: parsed.data.MONGODB_URI,
  },

  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    accessTokenTtl: parsed.data.ACCESS_TOKEN_TTL,
    refreshTokenTtl: parsed.data.REFRESH_TOKEN_TTL,
  },

  frontend: {
    url: parsed.data.FRONTEND_URL,
  },

  cors: {
    origins: parsed.data.CORS_ORIGINS.split(',').map((s) => s.trim()),
  },

  cookie: {
    domain: parsed.data.COOKIE_DOMAIN || undefined,
  },

  seed: {
    adminEmail: parsed.data.SEED_ADMIN_EMAIL,
    adminPassword: parsed.data.SEED_ADMIN_PASSWORD,
    adminEmployeeCode: parsed.data.SEED_ADMIN_EMPLOYEE_CODE,
  },
});

export type Env = typeof env;
