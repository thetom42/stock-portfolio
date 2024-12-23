import { PrismaClient } from '@prisma/client';
import sinon from 'sinon';
import { Decimal } from '@prisma/client/runtime/library';

// Create a mock PrismaClient
const mockPrisma = {} as PrismaClient;

// Helper to create Decimal values for tests
export const createDecimal = (value: number | string): Decimal => new Decimal(value);

// Create repository instances with mocked methods
class MockPortfolioRepository {
  prisma = mockPrisma;
  findById = sinon.stub();
  findByUserId = sinon.stub();
  create = sinon.stub();
  update = sinon.stub();
  delete = sinon.stub();
}

class MockUserRepository {
  prisma = mockPrisma;
  findById = sinon.stub();
  findByEmail = sinon.stub();
  create = sinon.stub();
  update = sinon.stub();
  delete = sinon.stub();
}

class MockQuoteRepository {
  prisma = mockPrisma;
  findById = sinon.stub();
  findByIsin = sinon.stub();
  findLatestByIsin = sinon.stub();
  create = sinon.stub();
  update = sinon.stub();
  delete = sinon.stub();
}

class MockStockRepository {
  prisma = mockPrisma;
  findByIsin = sinon.stub();
  findBySymbol = sinon.stub();
  findByWkn = sinon.stub();
  findAll = sinon.stub();
  findByCategory = sinon.stub();
  create = sinon.stub();
  update = sinon.stub();
  delete = sinon.stub();
}

class MockCategoryRepository {
  prisma = mockPrisma;
  findById = sinon.stub();
  findAll = sinon.stub();
  create = sinon.stub();
  update = sinon.stub();
  delete = sinon.stub();
}

class MockHoldingRepository {
  prisma = mockPrisma;
  findById = sinon.stub();
  findByPortfolioId = sinon.stub();
  findActiveByPortfolioId = sinon.stub();
  findByIsin = sinon.stub();
  create = sinon.stub();
  update = sinon.stub();
  delete = sinon.stub();
}

class MockTransactionRepository {
  prisma = mockPrisma;
  findById = sinon.stub();
  findByPortfolioId = sinon.stub();
  findByHoldingId = sinon.stub();
  create = sinon.stub();
  update = sinon.stub();
  delete = sinon.stub();
}

// Create instances
const mockPortfolioRepo = new MockPortfolioRepository();
const mockUserRepo = new MockUserRepository();
const mockQuoteRepo = new MockQuoteRepository();
const mockStockRepo = new MockStockRepository();
const mockCategoryRepo = new MockCategoryRepository();
const mockHoldingRepo = new MockHoldingRepository();
const mockTransactionRepo = new MockTransactionRepository();

// Setup functions
export const setupMockPortfolioRepo = () => {
  return { mockRepo: mockPortfolioRepo };
};

export const setupMockUserRepo = () => {
  return { mockRepo: mockUserRepo };
};

export const setupMockQuoteRepo = () => {
  return { mockRepo: mockQuoteRepo };
};

export const setupMockStockRepo = () => {
  return { mockRepo: mockStockRepo };
};

export const setupMockCategoryRepo = () => {
  return { mockRepo: mockCategoryRepo };
};

export const setupMockHoldingRepo = () => {
  return { mockRepo: mockHoldingRepo };
};

export const setupMockTransactionRepo = () => {
  return { mockRepo: mockTransactionRepo };
};

// Setup both quote and stock repos for quote service
export const setupMockQuoteAndStockRepos = () => {
  return { mockQuoteRepo, mockStockRepo };
};

// Setup holding and transaction repos for holding service
export const setupMockHoldingAndTransactionRepos = () => {
  return { mockHoldingRepo, mockTransactionRepo };
};

// Setup transaction, holding, and portfolio repos for transaction service
export const setupMockTransactionHoldingAndPortfolioRepos = () => {
  return { mockTransactionRepo, mockHoldingRepo, mockPortfolioRepo };
};

// Reset all mocks
export const resetAllMocks = () => {
  sinon.reset();
  [
    mockPortfolioRepo,
    mockUserRepo,
    mockQuoteRepo,
    mockStockRepo,
    mockCategoryRepo,
    mockHoldingRepo,
    mockTransactionRepo
  ].forEach(repo => {
    Object.values(repo).forEach(method => {
      if (typeof method === 'function' && method.reset) {
        method.reset();
      }
    });
  });
};
