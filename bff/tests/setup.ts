import chai from 'chai';
import chaiSpies from 'chai-spies';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { createMockPrismaClient, resetMockPrismaClient } from './helpers/mockPrisma';
import * as database from '../src/utils/database';
import path from 'path';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../.env.test') });

// Initialize chai plugins
chai.use(chaiSpies);
chai.use(chaiAsPromised);

// Make chai globally available
(global as any).chai = chai;
(global as any).expect = chai.expect;

// Setup test environment
export const mochaHooks = {
  beforeEach() {
    // Reset environment variables to test defaults
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_NAME = 'stockportfolio_test';
    process.env.DB_USER = 'postgres';
    process.env.DB_PASSWORD = 'test_password';
    process.env.KEYCLOAK_CLIENT_ID = 'bff-client-test';
    process.env.KEYCLOAK_CLIENT_SECRET = 'test_client_secret';
    process.env.YAHOO_FINANCE_API_KEY = 'test_api_key';
    process.env.JWT_SECRET = 'test_jwt_secret';

    // Setup mock Prisma client
    const mockPrismaClient = createMockPrismaClient();
    sinon.stub(database, 'getPrismaClient').returns(mockPrismaClient);
  },

  async afterEach() {
    // Clean up after each test
    const client = database.getPrismaClient();
    resetMockPrismaClient(client);
    await database.disconnectDatabase();
    sinon.restore();
    if (chaiSpies.restore) {
      chaiSpies.restore();
    }
  }
};

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Promise Rejection:', error);
});
