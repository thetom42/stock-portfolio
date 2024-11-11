import { expect, use } from 'chai';
import { before, after, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import dotenv from 'dotenv';
import { resetRepositoryMocks } from './helpers/mockRepositories';
import { disconnectDatabase } from '../src/utils/database';

// Configure chai plugins
use(sinonChai);

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';

// Make test utilities globally available
declare global {
  namespace NodeJS {
    interface Global {
      expect: typeof expect;
    }
  }
}
global.expect = expect;

// Configure test timeouts
const TEST_TIMEOUT = 5000;
const SUITE_TIMEOUT = 10000;

// Before all tests
before(async function() {
  this.timeout(SUITE_TIMEOUT);

  // Ensure we're in test environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must be run in test environment');
  }

  // Verify required test environment variables
  const requiredEnvVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_NAME',
    'DB_USER',
    'DB_PASSWORD',
    'KEYCLOAK_AUTH_SERVER_URL',
    'KEYCLOAK_REALM',
    'KEYCLOAK_CLIENT_ID',
    'KEYCLOAK_CLIENT_SECRET',
    'YAHOO_FINANCE_API_KEY'
  ];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Required test environment variable missing: ${envVar}`);
    }
  }

  // Set default test timeouts
  this.slow(TEST_TIMEOUT / 2);
  this.timeout(TEST_TIMEOUT);

  console.log('Test environment setup complete');
});

// After all tests
after(async function() {
  this.timeout(SUITE_TIMEOUT);

  // Disconnect from test database
  await disconnectDatabase();

  console.log('Test environment cleanup complete');
});

// Before each test
beforeEach(function() {
  // Reset all repository mocks
  resetRepositoryMocks();

  // Create a new sandbox for each test
  this.sinon = sinon.createSandbox();
});

// After each test
afterEach(function() {
  // Restore all sinon stubs/spies
  if (this.sinon) {
    this.sinon.restore();
  }

  // Clear all repository mocks
  resetRepositoryMocks();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Export test configuration
export const testConfig = {
  TEST_TIMEOUT,
  SUITE_TIMEOUT
};
