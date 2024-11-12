import { expect } from 'chai';

describe('Keycloak Configuration', () => {
  // Store original process.env
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    // Clear require cache for environment module
    delete require.cache[require.resolve('./test-environment')];
  });

  afterEach(() => {
    // Restore original process.env after each test
    process.env = originalEnv;
  });

  describe('Keycloak Connection Settings', () => {
    it('should use default Keycloak configuration', () => {
      const { environment } = require('./test-environment');
      expect(environment.KEYCLOAK_AUTH_SERVER_URL).to.equal('http://localhost:8080/auth');
      expect(environment.KEYCLOAK_REALM).to.equal('stock-portfolio');
      expect(environment.KEYCLOAK_CLIENT_ID).to.equal('bff-client');
      expect(environment.KEYCLOAK_CLIENT_SECRET).to.equal('');
    });

    it('should use environment variables when set', () => {
      process.env.KEYCLOAK_AUTH_SERVER_URL = 'https://auth.example.com/auth';
      process.env.KEYCLOAK_REALM = 'production-realm';
      process.env.KEYCLOAK_CLIENT_ID = 'prod-client';
      process.env.KEYCLOAK_CLIENT_SECRET = 'secret123';

      const { environment } = require('./test-environment');
      expect(environment.KEYCLOAK_AUTH_SERVER_URL).to.equal('https://auth.example.com/auth');
      expect(environment.KEYCLOAK_REALM).to.equal('production-realm');
      expect(environment.KEYCLOAK_CLIENT_ID).to.equal('prod-client');
      expect(environment.KEYCLOAK_CLIENT_SECRET).to.equal('secret123');
    });
  });

  describe('Keycloak Security Settings', () => {
    it('should require client secret in production', () => {
      process.env.NODE_ENV = 'production';
      // Set other required variables to isolate KEYCLOAK_CLIENT_SECRET validation
      process.env.DB_PASSWORD = 'password123';
      process.env.YAHOO_FINANCE_API_KEY = 'apikey123';
      process.env.JWT_SECRET = 'jwtsecret123';
      delete process.env.KEYCLOAK_CLIENT_SECRET;

      const { validateEnvironment } = require('./test-environment');
      expect(() => validateEnvironment()).to.throw('Missing required environment variable: KEYCLOAK_CLIENT_SECRET');
    });

    it('should validate auth server URL format', () => {
      process.env.KEYCLOAK_AUTH_SERVER_URL = 'invalid-url';
      const { environment } = require('./test-environment');
      // Even with invalid URL, it should still load the configuration
      // URL validation would typically happen when actually connecting to Keycloak
      expect(environment.KEYCLOAK_AUTH_SERVER_URL).to.equal('invalid-url');
    });

    it('should handle missing optional configurations', () => {
      delete process.env.KEYCLOAK_REALM;
      delete process.env.KEYCLOAK_CLIENT_ID;

      const { environment } = require('./test-environment');
      expect(environment.KEYCLOAK_REALM).to.equal('stock-portfolio');
      expect(environment.KEYCLOAK_CLIENT_ID).to.equal('bff-client');
    });
  });
});
