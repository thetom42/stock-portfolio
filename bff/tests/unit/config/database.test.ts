import { expect } from 'chai';
import { environment } from './test-environment';

describe('Database Configuration', () => {
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

  describe('Database Connection Settings', () => {
    it('should use default database configuration', () => {
      const { environment } = require('./test-environment');
      expect(environment.DB_HOST).to.equal('localhost');
      expect(environment.DB_PORT).to.equal(5432);
      expect(environment.DB_NAME).to.equal('stockportfolio');
      expect(environment.DB_USER).to.equal('postgres');
      expect(environment.DB_PASSWORD).to.equal('');
      expect(environment.DB_SSL).to.be.false;
    });

    it('should use environment variables when set', () => {
      process.env.DB_HOST = 'db.example.com';
      process.env.DB_PORT = '5433';
      process.env.DB_NAME = 'proddb';
      process.env.DB_USER = 'produser';
      process.env.DB_PASSWORD = 'password123';
      process.env.DB_SSL = 'true';

      const { environment } = require('./test-environment');
      expect(environment.DB_HOST).to.equal('db.example.com');
      expect(environment.DB_PORT).to.equal(5433);
      expect(environment.DB_NAME).to.equal('proddb');
      expect(environment.DB_USER).to.equal('produser');
      expect(environment.DB_PASSWORD).to.equal('password123');
      expect(environment.DB_SSL).to.be.true;
    });

    it('should handle invalid port number', () => {
      process.env.DB_PORT = 'invalid';
      const { environment } = require('./test-environment');
      expect(environment.DB_PORT).to.equal(5432);
    });

    it('should handle SSL configuration correctly', () => {
      // Test explicit true
      process.env.DB_SSL = 'true';
      let env = require('./test-environment').environment;
      expect(env.DB_SSL).to.be.true;

      // Test explicit false
      process.env.DB_SSL = 'false';
      delete require.cache[require.resolve('./test-environment')];
      env = require('./test-environment').environment;
      expect(env.DB_SSL).to.be.false;

      // Test invalid value (should default to false)
      process.env.DB_SSL = 'invalid';
      delete require.cache[require.resolve('./test-environment')];
      env = require('./test-environment').environment;
      expect(env.DB_SSL).to.be.false;
    });
  });
});
