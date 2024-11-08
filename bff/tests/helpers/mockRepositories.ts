import sinon from 'sinon';
import * as database from '../../src/utils/database';

// Create minimal mock implementations that match what our tests need
export const mockHoldingRepo = {
  create: sinon.stub(),
  findById: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub(),
  validateHolding: sinon.stub(),
  findByPortfolio: sinon.stub(),
  findActiveByPortfolio: sinon.stub()
};

export const mockPortfolioRepo = {
  create: sinon.stub(),
  findById: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub(),
  findByUserId: sinon.stub()
};

export const mockTransactionRepo = {
  create: sinon.stub(),
  findById: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub(),
  findByHolding: sinon.stub(),
  validateTransaction: sinon.stub(),
  findByHoldingAndType: sinon.stub(),
  calculateHoldingCostBasis: sinon.stub()
};

export const mockQuoteRepo = {
  create: sinon.stub(),
  findLatestByStock: sinon.stub(),
  findByStockAndTimeRange: sinon.stub()
};

export const mockStockRepo = {
  findByISIN: sinon.stub(),
  findBySymbol: sinon.stub(),
  findByWKN: sinon.stub(),
  findAll: sinon.stub(),
  findByCategory: sinon.stub(),
  create: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub()
};

export const mockUserRepo = {
  create: sinon.stub(),
  findById: sinon.stub(),
  findByEmail: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub()
};

// Type assertion to match repository interfaces
export const setupRepositoryMocks = () => {
  sinon.stub(database, 'getHoldingRepository').returns(mockHoldingRepo as any);
  sinon.stub(database, 'getPortfolioRepository').returns(mockPortfolioRepo as any);
  sinon.stub(database, 'getTransactionRepository').returns(mockTransactionRepo as any);
  sinon.stub(database, 'getQuoteRepository').returns(mockQuoteRepo as any);
  sinon.stub(database, 'getStockRepository').returns(mockStockRepo as any);
  sinon.stub(database, 'getUserRepository').returns(mockUserRepo as any);
};

export const resetRepositoryMocks = () => {
  // Reset all stubs
  Object.values(mockHoldingRepo).forEach(stub => {
    if (typeof stub === 'function' && 'reset' in stub) {
      (stub as sinon.SinonStub).reset();
    }
  });

  Object.values(mockPortfolioRepo).forEach(stub => {
    if (typeof stub === 'function' && 'reset' in stub) {
      (stub as sinon.SinonStub).reset();
    }
  });

  Object.values(mockTransactionRepo).forEach(stub => {
    if (typeof stub === 'function' && 'reset' in stub) {
      (stub as sinon.SinonStub).reset();
    }
  });

  Object.values(mockQuoteRepo).forEach(stub => {
    if (typeof stub === 'function' && 'reset' in stub) {
      (stub as sinon.SinonStub).reset();
    }
  });

  Object.values(mockStockRepo).forEach(stub => {
    if (typeof stub === 'function' && 'reset' in stub) {
      (stub as sinon.SinonStub).reset();
    }
  });

  Object.values(mockUserRepo).forEach(stub => {
    if (typeof stub === 'function' && 'reset' in stub) {
      (stub as sinon.SinonStub).reset();
    }
  });

  sinon.restore();
};
