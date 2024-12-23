export const environment = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.INTERNAL_BFF_PORT || '3001', 10),
  API_PREFIX: '/api',

  // Database configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '5432', 10),
  DB_NAME: process.env.DB_NAME || 'stockportfolio',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_SSL: process.env.DB_SSL === 'true',

  // Keycloak configuration
  // Always use the Docker service name when running in a container
  KEYCLOAK_AUTH_SERVER_URL: process.env.DB_HOST === 'postgres'
    ? 'http://keycloak:8080'
    : (process.env.KEYCLOAK_AUTH_SERVER_URL || 'http://localhost:8080'),
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
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // Cache configuration
  CACHE_TTL: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes in seconds
};

// Type definitions for environment variables
export interface Environment {
  NODE_ENV: string;
  PORT: number;
  API_PREFIX: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_SSL: boolean;
  KEYCLOAK_AUTH_SERVER_URL: string;
  KEYCLOAK_REALM: string;
  KEYCLOAK_CLIENT_ID: string;
  KEYCLOAK_CLIENT_SECRET: string;
  YAHOO_FINANCE_API_KEY: string;
  YAHOO_FINANCE_API_HOST: string;
  CORS_ORIGIN: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  LOG_LEVEL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CACHE_TTL: number;
}

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
