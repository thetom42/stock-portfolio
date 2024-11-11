import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { PrismaClient } from '@prisma/client';
import * as database from '../../../src/utils/database';

describe('Database Utils', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getPrismaClient', () => {
    it('should create a new PrismaClient instance if none exists', () => {
      const prismaInstance = database.getPrismaClient();
      expect(prismaInstance).to.be.instanceOf(PrismaClient);
    });

    it('should return the same instance on subsequent calls', () => {
      const firstInstance = database.getPrismaClient();
      const secondInstance = database.getPrismaClient();
      expect(firstInstance).to.equal(secondInstance);
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect and clear the PrismaClient instance', async () => {
      const disconnectSpy = sinon.spy();
      const mockPrisma = {
        $disconnect: disconnectSpy
      };

      // @ts-ignore - Mocking private property
      database.getPrismaClient();
      // @ts-ignore - Setting mock client
      (database as any).prisma = mockPrisma;

      await database.disconnectDatabase();

      expect(disconnectSpy.calledOnce).to.be.true;
      // @ts-ignore - Checking private property
      expect((database as any).prisma).to.be.null;
    });

    it('should handle case when no client exists', async () => {
      // @ts-ignore - Setting null client
      (database as any).prisma = null;
      await database.disconnectDatabase();
      // Should not throw error
    });
  });

  describe('getRepository', () => {
    it('should create a new repository instance if none exists', () => {
      const holdingRepo = database.getHoldingRepository();
      expect(holdingRepo).to.not.be.undefined;
      expect(holdingRepo.findById).to.be.a('function');
    });

    it('should return the same repository instance on subsequent calls', () => {
      const firstInstance = database.getHoldingRepository();
      const secondInstance = database.getHoldingRepository();
      expect(firstInstance).to.equal(secondInstance);
    });

    it('should throw error for invalid repository name', () => {
      expect(() => {
        // @ts-ignore - Testing invalid repository name
        database.getRepository('invalid')
      }).to.throw('Repository not found: invalid');
    });

    it('should handle repository initialization errors', () => {
      // Mock require to throw error
      const requireStub = sinon.stub(require('module'), '_load').throws(new Error('Module not found'));

      expect(() => {
        database.getRepository('holding')
      }).to.throw('Repository not found: holding');

      requireStub.restore();
    });
  });

  describe('Repository Getters', () => {
    it('getHoldingRepository should return HoldingRepository instance', () => {
      const repo = database.getHoldingRepository();
      expect(repo.findById).to.be.a('function');
      expect(repo.findByPortfolio).to.be.a('function');
    });

    it('getPortfolioRepository should return PortfolioRepository instance', () => {
      const repo = database.getPortfolioRepository();
      expect(repo.findById).to.be.a('function');
      expect(repo.findByUserId).to.be.a('function');
    });

    it('getStockRepository should return StockRepository instance', () => {
      const repo = database.getStockRepository();
      expect(repo.findByISIN).to.be.a('function');
      expect(repo.findBySymbol).to.be.a('function');
    });

    it('getUserRepository should return UserRepository instance', () => {
      const repo = database.getUserRepository();
      expect(repo.findById).to.be.a('function');
      expect(repo.findByEmail).to.be.a('function');
    });

    it('getQuoteRepository should return QuoteRepository instance', () => {
      const repo = database.getQuoteRepository();
      expect(repo.findLatestByStock).to.be.a('function');
      expect(repo.findByStockAndTimeRange).to.be.a('function');
    });

    it('getTransactionRepository should return TransactionRepository instance', () => {
      const repo = database.getTransactionRepository();
      expect(repo.findById).to.be.a('function');
      expect(repo.findByHolding).to.be.a('function');
    });

    it('getCategoryRepository should return CategoryRepository instance', () => {
      const repo = database.getCategoryRepository();
      expect(repo.findById).to.be.a('function');
      expect(repo.findByName).to.be.a('function');
    });
  });

  describe('Repository Caching', () => {
    it('should cache repositories across different getter methods', () => {
      const firstInstance = database.getRepository('holding');
      const secondInstance = database.getHoldingRepository();
      expect(firstInstance).to.equal(secondInstance);
    });

    it('should maintain separate instances for different repositories', () => {
      const holdingRepo = database.getHoldingRepository();
      const portfolioRepo = database.getPortfolioRepository();
      expect(holdingRepo).to.not.equal(portfolioRepo);
    });

    it('should create new instances after database disconnect', async () => {
      const firstInstance = database.getHoldingRepository();
      await database.disconnectDatabase();
      const secondInstance = database.getHoldingRepository();
      expect(firstInstance).to.not.equal(secondInstance);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Reset repositories cache before each test
      // @ts-ignore - Accessing private property
      (database as any).repositories = {};
    });

    it('should handle PrismaClient initialization errors', () => {
      const PrismaClientStub = sinon.stub(PrismaClient.prototype, 'constructor').throws(
        new Error('Failed to connect to database')
      );

      expect(() => database.getPrismaClient()).to.throw('Failed to connect to database');

      PrismaClientStub.restore();
    });

    it('should handle repository initialization errors', () => {
      // Mock require to throw error
      const requireStub = sinon.stub(require('module'), '_load').throws(
        new Error('Failed to load repository')
      );

      expect(() => database.getHoldingRepository()).to.throw('Repository not found: holding');

      requireStub.restore();
    });

    it('should handle disconnect errors', async () => {
      const mockPrisma = {
        $disconnect: sinon.stub().rejects(new Error('Disconnect failed'))
      };

      // @ts-ignore - Setting mock client
      (database as any).prisma = mockPrisma;

      try {
        await database.disconnectDatabase();
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Disconnect failed');
      }
    });
  });
});
