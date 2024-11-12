import { expect } from 'chai';

describe('Environment Configuration', () => {
  // Store original process.env and require cache
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    // Clear all environment variables that might affect our tests
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_NAME;
    delete process.env.DB_USER;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_SSL;
    delete process.env.KEYCLOAK_CLIENT_SECRET;
    delete process.env.YAHOO_FINANCE_API_KEY;
    delete process.env.JWT_SECRET;
    delete process.env.CORS_ORIGIN;
    delete process.env.LOG_LEVEL;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX_REQUESTS;
    delete process.env.CACHE_TTL;

    // Clear require cache for environment module
    delete require.cache[require.resolve('./test-environment')];
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = originalEnv;
  });

  describe('Default Values', () => {
    it('should have default values when environment variables are not set', () => {
      const { environment } = require('./test-environment');
      expect(environment.NODE_ENV).to.equal('development');
      expect(environment.PORT).to.equal(3000);
      expect(environment.API_PREFIX).to.equal('/api');
      expect(environment.DB_HOST).to.equal('localhost');
      expect(environment.DB_PORT).to.equal(5432);
      expect(environment.DB_NAME).to.equal('stockportfolio');
      expect(environment.DB_USER).to.equal('postgres');
      expect(environment.DB_SSL).to.be.false;
      expect(environment.CORS_ORIGIN).to.equal('http://localhost:4200');
      expect(environment.LOG_LEVEL).to.equal('info');
      expect(environment.RATE_LIMIT_WINDOW_MS).to.equal(900000);
      expect(environment.RATE_LIMIT_MAX_REQUESTS).to.equal(100);
      expect(environment.CACHE_TTL).to.equal(300);
    });
  });

  describe('Environment Variable Override', () => {
    it('should use environment variables when set', () => {
      // Set environment variables
      process.env.NODE_ENV = 'production';
      process.env.PORT = '8080';
      process.env.DB_HOST = 'db.example.com';
      process.env.DB_PORT = '5433';
      process.env.DB_NAME = 'proddb';
      process.env.DB_USER = 'produser';
      process.env.DB_PASSWORD = 'password123';
      process.env.DB_SSL = 'true';
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.LOG_LEVEL = 'error';
      process.env.RATE_LIMIT_WINDOW_MS = '1800000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '50';
      process.env.CACHE_TTL = '600';

      const { environment } = require('./test-environment');
      expect(environment.NODE_ENV).to.equal('production');
      expect(environment.PORT).to.equal(8080);
      expect(environment.DB_HOST).to.equal('db.example.com');
      expect(environment.DB_PORT).to.equal(5433);
      expect(environment.DB_NAME).to.equal('proddb');
      expect(environment.DB_USER).to.equal('produser');
      expect(environment.DB_PASSWORD).to.equal('password123');
      expect(environment.DB_SSL).to.be.true;
      expect(environment.CORS_ORIGIN).to.equal('https://example.com');
      expect(environment.LOG_LEVEL).to.equal('error');
      expect(environment.RATE_LIMIT_WINDOW_MS).to.equal(1800000);
      expect(environment.RATE_LIMIT_MAX_REQUESTS).to.equal(50);
      expect(environment.CACHE_TTL).to.equal(600);
    });

    it('should handle invalid numeric values', () => {
      process.env.PORT = 'invalid';
      process.env.DB_PORT = 'invalid';
      process.env.RATE_LIMIT_WINDOW_MS = 'invalid';
      process.env.RATE_LIMIT_MAX_REQUESTS = 'invalid';
      process.env.CACHE_TTL = 'invalid';

      const { environment } = require('./test-environment');
      expect(environment.PORT).to.equal(3000);
      expect(environment.DB_PORT).to.equal(5432);
      expect(environment.RATE_LIMIT_WINDOW_MS).to.equal(900000);
      expect(environment.RATE_LIMIT_MAX_REQUESTS).to.equal(100);
      expect(environment.CACHE_TTL).to.equal(300);
    });
  });

  describe('Environment Validation', () => {
    it('should pass validation when all required variables are set', () => {
      process.env.DB_PASSWORD = 'password123';
      process.env.KEYCLOAK_CLIENT_SECRET = 'secret123';
      process.env.YAHOO_FINANCE_API_KEY = 'apikey123';
      process.env.JWT_SECRET = 'jwtsecret123';
      const { validateEnvironment } = require('./test-environment');
      expect(() => validateEnvironment()).to.not.throw();
    });

    it('should throw error when DB_PASSWORD is missing', () => {
      process.env.KEYCLOAK_CLIENT_SECRET = 'secret123';
      process.env.YAHOO_FINANCE_API_KEY = 'apikey123';
      process.env.JWT_SECRET = 'jwtsecret123';
      const { validateEnvironment } = require('./test-environment');
      expect(() => validateEnvironment()).to.throw('Missing required environment variable: DB_PASSWORD');
    });

    it('should throw error when KEYCLOAK_CLIENT_SECRET is missing', () => {
      process.env.DB_PASSWORD = 'password123';
      process.env.YAHOO_FINANCE_API_KEY = 'apikey123';
      process.env.JWT_SECRET = 'jwtsecret123';
      const { validateEnvironment } = require('./test-environment');
      expect(() => validateEnvironment()).to.throw('Missing required environment variable: KEYCLOAK_CLIENT_SECRET');
    });

    it('should throw error when YAHOO_FINANCE_API_KEY is missing', () => {
      process.env.DB_PASSWORD = 'password123';
      process.env.KEYCLOAK_CLIENT_SECRET = 'secret123';
      process.env.JWT_SECRET = 'jwtsecret123';
      const { validateEnvironment } = require('./test-environment');
      expect(() => validateEnvironment()).to.throw('Missing required environment variable: YAHOO_FINANCE_API_KEY');
    });

    it('should throw error when JWT_SECRET is missing', () => {
      process.env.DB_PASSWORD = 'password123';
      process.env.KEYCLOAK_CLIENT_SECRET = 'secret123';
      process.env.YAHOO_FINANCE_API_KEY = 'apikey123';
      const { validateEnvironment } = require('./test-environment');
      expect(() => validateEnvironment()).to.throw('Missing required environment variable: JWT_SECRET');
    });
  });

  describe('Type Safety', () => {
    it('should maintain correct types for all environment variables', () => {
      const { environment } = require('./test-environment');
      expect(typeof environment.NODE_ENV).to.equal('string');
      expect(typeof environment.PORT).to.equal('number');
      expect(typeof environment.API_PREFIX).to.equal('string');
      expect(typeof environment.DB_HOST).to.equal('string');
      expect(typeof environment.DB_PORT).to.equal('number');
      expect(typeof environment.DB_NAME).to.equal('string');
      expect(typeof environment.DB_USER).to.equal('string');
      expect(typeof environment.DB_PASSWORD).to.equal('string');
      expect(typeof environment.DB_SSL).to.equal('boolean');
      expect(typeof environment.KEYCLOAK_AUTH_SERVER_URL).to.equal('string');
      expect(typeof environment.KEYCLOAK_REALM).to.equal('string');
      expect(typeof environment.KEYCLOAK_CLIENT_ID).to.equal('string');
      expect(typeof environment.KEYCLOAK_CLIENT_SECRET).to.equal('string');
      expect(typeof environment.YAHOO_FINANCE_API_KEY).to.equal('string');
      expect(typeof environment.YAHOO_FINANCE_API_HOST).to.equal('string');
      expect(typeof environment.CORS_ORIGIN).to.equal('string');
      expect(typeof environment.JWT_SECRET).to.equal('string');
      expect(typeof environment.JWT_EXPIRATION).to.equal('string');
      expect(typeof environment.LOG_LEVEL).to.equal('string');
      expect(typeof environment.RATE_LIMIT_WINDOW_MS).to.equal('number');
      expect(typeof environment.RATE_LIMIT_MAX_REQUESTS).to.equal('number');
      expect(typeof environment.CACHE_TTL).to.equal('number');
    });
  });
});
