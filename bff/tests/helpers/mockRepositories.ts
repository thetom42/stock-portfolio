import sinon from 'sinon';
import { 
  HoldingRepository,
  PortfolioRepository,
  TransactionRepository,
  QuoteRepository,
  StockRepository,
  UserRepository,
  CategoryRepository
} from '@stock-portfolio/db';
import { setStockRepository } from '../../src/services/stockService';
import { setHoldingRepository } from '../../src/services/holdingService';
import { setTransactionRepository } from '../../src/services/transactionService';
import { setPortfolioRepository } from '../../src/services/portfolioService';
import { setUserRepository } from '../../src/services/userService';
import { Decimal } from '@prisma/client/runtime/library';

// Create a proper Decimal mock that matches the Prisma Decimal interface
const createDecimalMock = (value: number | string): Decimal => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Decimal(numValue.toString());
};

// Create stub repositories with proper method stubs
export const mockHoldingRepo = {
  create: sinon.stub(),
  findById: sinon.stub(),
  findByPortfolioId: sinon.stub(),
  findActiveByPortfolioId: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub()
} as unknown as HoldingRepository & { [K in keyof HoldingRepository]: sinon.SinonStub };

export const mockPortfolioRepo = {
  create: sinon.stub(),
  findById: sinon.stub(),
  findByUserId: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub()
} as unknown as PortfolioRepository & { [K in keyof PortfolioRepository]: sinon.SinonStub };

export const mockTransactionRepo = {
  create: sinon.stub(),
  findById: sinon.stub(),
  findByHoldingId: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub()
} as unknown as TransactionRepository & { [K in keyof TransactionRepository]: sinon.SinonStub };

export const mockQuoteRepo = {
  create: sinon.stub(),
  findLatestByIsin: sinon.stub(),
  findByIsin: sinon.stub()
} as unknown as QuoteRepository & { [K in keyof QuoteRepository]: sinon.SinonStub };

export const mockStockRepo = {
  findByIsin: sinon.stub(),
  findBySymbol: sinon.stub(),
  findByWkn: sinon.stub(),
  findByCategory: sinon.stub(),
  findAll: sinon.stub(),
  create: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub()
} as unknown as StockRepository & { [K in keyof StockRepository]: sinon.SinonStub };

export const mockUserRepo = {
  create: sinon.stub(),
  findById: sinon.stub(),
  findByEmail: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub()
} as unknown as UserRepository & { [K in keyof UserRepository]: sinon.SinonStub };

export const mockCategoryRepo = {
  create: sinon.stub(),
  findById: sinon.stub(),
  findByName: sinon.stub(),
  findAll: sinon.stub(),
  update: sinon.stub(),
  delete: sinon.stub()
} as unknown as CategoryRepository & { [K in keyof CategoryRepository]: sinon.SinonStub };

// Setup mocks by replacing the repository instances in services
export const setupRepositoryMocks = () => {
  // Reset all stubs before setup
  resetRepositoryMocks();
  
  // Inject mocks using the DI setters
  setStockRepository(mockStockRepo);
  setTransactionRepository(mockTransactionRepo);
  setHoldingRepository(mockHoldingRepo);
  setPortfolioRepository(mockPortfolioRepo);
  setUserRepository(mockUserRepo);
};

export const resetRepositoryMocks = () => {
  // Reset all stubs
  Object.values(mockHoldingRepo).forEach(stub => stub.reset?.());
  Object.values(mockPortfolioRepo).forEach(stub => stub.reset?.());
  Object.values(mockTransactionRepo).forEach(stub => stub.reset?.());
  Object.values(mockQuoteRepo).forEach(stub => stub.reset?.());
  Object.values(mockStockRepo).forEach(stub => stub.reset?.());
  Object.values(mockUserRepo).forEach(stub => stub.reset?.());
  Object.values(mockCategoryRepo).forEach(stub => stub.reset?.());
};

// Helper function to create a Decimal value for tests
export const createDecimal = createDecimalMock;
