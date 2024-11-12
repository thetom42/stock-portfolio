// Test environment configuration
const parseIntWithDefault = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const environment = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseIntWithDefault(process.env.PORT, 3000),
  API_PREFIX: '/api',

  // Database configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseIntWithDefault(process.env.DB_PORT, 5432),
  DB_NAME: process.env.DB_NAME || 'stockportfolio',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_SSL: process.env.DB_SSL === 'true',

  // Keycloak configuration
  KEYCLOAK_AUTH_SERVER_URL: process.env.KEYCLOAK_AUTH_SERVER_URL || 'http://localhost:8080/auth',
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM || 'stock-portfolio',
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'bff-client',
  KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET || '',

  // Yahoo Finance API
  YAHOO_FINANCE_API_KEY: process.env.YAHOO_FINANCE_API_KEY || '',
  YAHOO_FINANCE_API_HOST: process.env.YAHOO_FINANCE_API_HOST || 'yh-finance.p.rapidapi.com',

  // Security
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4200',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1h',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseIntWithDefault(process.env.RATE_LIMIT_WINDOW_MS, 900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseIntWithDefault(process.env.RATE_LIMIT_MAX_REQUESTS, 100),

  // Cache configuration
  CACHE_TTL: parseIntWithDefault(process.env.CACHE_TTL, 300), // 5 minutes in seconds
};

// Validate required environment variables
export const validateEnvironment = (): void => {
  const requiredVars = [
    'DB_PASSWORD',
    'KEYCLOAK_CLIENT_SECRET',
    'YAHOO_FINANCE_API_KEY',
    'JWT_SECRET'
  ];

  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  }
};
