import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

use(chaiAsPromised);
use(sinonChai);

describe('Database Utils', () => {
  let mockPrismaClient: any;
  let disconnectStub: sinon.SinonStub;
  let database: any;

  beforeEach(() => {
    // Create disconnect stub
    disconnectStub = sinon.stub().resolves();

    // Create a mock PrismaClient instance
    mockPrismaClient = {
      $disconnect: disconnectStub
    };

    // Mock the @stock-portfolio/db module
    database = proxyquire('../../../src/utils/database', {
      '@stock-portfolio/db': {
        prisma: mockPrismaClient,
        '@noCallThru': true
      }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getPrismaClient', () => {
    it('should create a new PrismaClient instance if none exists', () => {
      const client = database.getPrismaClient();
      expect(client).to.equal(mockPrismaClient);
      expect(client.$disconnect).to.equal(disconnectStub);
    });

    it('should return the same instance on subsequent calls', () => {
      const firstClient = database.getPrismaClient();
      const secondClient = database.getPrismaClient();
      expect(firstClient).to.equal(secondClient);
      expect(firstClient).to.equal(mockPrismaClient);
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect and clear the PrismaClient instance', async () => {
      // Get initial client
      const client = database.getPrismaClient();
      
      // Reset the stub count before the actual test
      disconnectStub.resetHistory();
      
      await database.disconnectDatabase();
      
      expect(disconnectStub).to.have.been.calledOnce;
      
      // Get a new client to verify we get the shared instance again
      const newClient = database.getPrismaClient();
      expect(newClient).to.equal(mockPrismaClient);
    });

    it('should handle case when no client exists', async () => {
      // First disconnect to clear the client
      await database.disconnectDatabase();
      
      // Reset the stub count
      disconnectStub.resetHistory();
      
      // Should not throw when called again
      await expect(database.disconnectDatabase()).to.be.fulfilled;
      expect(disconnectStub).to.not.have.been.called;
    });
  });
});
