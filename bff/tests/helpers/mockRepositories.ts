import sinon from 'sinon';
import { HoldingRepository } from '../../../db/repositories/HoldingRepository';
import { PortfolioRepository } from '../../../db/repositories/PortfolioRepository';
import { TransactionRepository } from '../../../db/repositories/TransactionRepository';
import { QuoteRepository } from '../../../db/repositories/QuoteRepository';
import { StockRepository } from '../../../db/repositories/StockRepository';
import { UserRepository } from '../../../db/repositories/UserRepository';
import { CategoryRepository } from '../../../db/repositories/CategoryRepository';

// Create type-safe stub instances
export const mockHoldingRepo = sinon.createStubInstance(HoldingRepository);
export const mockPortfolioRepo = sinon.createStubInstance(PortfolioRepository);
export const mockTransactionRepo = sinon.createStubInstance(TransactionRepository);
export const mockQuoteRepo = sinon.createStubInstance(QuoteRepository);
export const mockStockRepo = sinon.createStubInstance(StockRepository);
export const mockUserRepo = sinon.createStubInstance(UserRepository);
export const mockCategoryRepo = sinon.createStubInstance(CategoryRepository);

// Setup mocks by replacing the repository instances in services
export const setupRepositoryMocks = () => {
  // The actual replacement of repository instances will be done in each test
  // by directly assigning the mock to the service's repository property
  // Example: (holdingService as any).holdingRepository = mockHoldingRepo;
};

export const resetRepositoryMocks = () => {
  // Reset all stubs
  mockHoldingRepo.create.reset();
  mockHoldingRepo.findById.reset();
  mockHoldingRepo.update.reset();
  mockHoldingRepo.delete.reset();
  mockHoldingRepo.findByPortfolio.reset();
  mockHoldingRepo.findActiveByPortfolio.reset();
  mockHoldingRepo.updateQuantity.reset();
  mockHoldingRepo.closeHolding.reset();

  mockPortfolioRepo.create.reset();
  mockPortfolioRepo.findById.reset();
  mockPortfolioRepo.update.reset();
  mockPortfolioRepo.delete.reset();
  mockPortfolioRepo.findByUserId.reset();

  mockTransactionRepo.create.reset();
  mockTransactionRepo.findById.reset();
  mockTransactionRepo.update.reset();
  mockTransactionRepo.delete.reset();
  mockTransactionRepo.findByHolding.reset();
  mockTransactionRepo.findByHoldingAndType.reset();
  mockTransactionRepo.getTotalValue.reset();

  mockQuoteRepo.create.reset();
  mockQuoteRepo.findLatestByStock.reset();
  mockQuoteRepo.findByStockAndTimeRange.reset();

  mockStockRepo.findByISIN.reset();
  mockStockRepo.findBySymbol.reset();
  mockStockRepo.findByWKN.reset();
  mockStockRepo.findAll.reset();
  mockStockRepo.findByCategory.reset();
  mockStockRepo.create.reset();
  mockStockRepo.update.reset();
  mockStockRepo.delete.reset();

  mockUserRepo.create.reset();
  mockUserRepo.findById.reset();
  mockUserRepo.findByEmail.reset();
  mockUserRepo.update.reset();
  mockUserRepo.delete.reset();

  mockCategoryRepo.create.reset();
  mockCategoryRepo.findById.reset();
  mockCategoryRepo.findByName.reset();
  mockCategoryRepo.findAll.reset();
  mockCategoryRepo.update.reset();
  mockCategoryRepo.delete.reset();

  sinon.restore();
};

// Helper function to create a Decimal value for tests
export const createDecimal = (value: number) => {
  return { toString: () => value.toString() } as any;
};
