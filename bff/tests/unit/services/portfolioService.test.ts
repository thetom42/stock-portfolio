import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import { Decimal } from '@prisma/client/runtime/library';
import { 
  mockPortfolioRepo,
  mockHoldingRepo,
  mockTransactionRepo,
  mockStockRepo,
  setupRepositoryMocks, 
  resetRepositoryMocks 
} from '../../helpers/mockRepositories';
import * as portfolioService from '../../../src/services/portfolioService';
import * as quoteService from '../../../src/services/quoteService';
import { CreatePortfolioDTO, UpdatePortfolioDTO } from '../../../src/models/Portfolio';

use(spies);

describe('PortfolioService', () => {
  const userId = 'user123';
  const portfolioId = 'portfolio123';
  const holdingId = 'holding123';

  const mockQuote = {
    price: 160.50,
    change: 10,
    changePercent: 6.64,
    timestamp: new Date()
  };

  const mockCreatedDate = new Date('2023-01-01T00:00:00Z');

  beforeEach(() => {
    setupRepositoryMocks();
    sinon.stub(quoteService, 'getRealTimeQuote').resolves(mockQuote);
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  describe('createPortfolio', () => {
    const mockPortfolioData: CreatePortfolioDTO = {
      name: 'Test Portfolio'
    };

    const mockCreatedPortfolio = {
      PORTFOLIOS_ID: portfolioId,
      USERS_ID: userId,
      NAME: mockPortfolioData.name,
      CREATED_AT: mockCreatedDate
    };

    it('should create a portfolio successfully', async () => {
      mockPortfolioRepo.create.resolves(mockCreatedPortfolio);

      const result = await portfolioService.createPortfolio(userId, mockPortfolioData);

      expect(result).to.deep.include({
        id: portfolioId,
        userId: userId,
        name: mockPortfolioData.name,
        createdAt: mockCreatedDate,
        updatedAt: mockCreatedDate // Should match CREATED_AT since no updated_at in DB
      });
      expect(mockPortfolioRepo.create.calledOnceWith({
        PORTFOLIOS_ID: '',
        USERS_ID: userId,
        NAME: mockPortfolioData.name,
        CREATED_AT: sinon.match.date
      })).to.be.true;
    });
  });

  describe('getPortfoliosByUserId', () => {
    const mockPortfolios = [{
      PORTFOLIOS_ID: portfolioId,
      USERS_ID: userId,
      NAME: 'Test Portfolio',
      CREATED_AT: mockCreatedDate
    }];

    it('should return user portfolios with correct date mapping', async () => {
      mockPortfolioRepo.findByUserId.resolves(mockPortfolios);

      const result = await portfolioService.getPortfoliosByUserId(userId);

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: portfolioId,
        userId: userId,
        name: 'Test Portfolio',
        createdAt: mockCreatedDate,
        updatedAt: mockCreatedDate
      });
    });

    it('should return empty array when user has no portfolios', async () => {
      mockPortfolioRepo.findByUserId.resolves([]);

      const result = await portfolioService.getPortfoliosByUserId(userId);

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getPortfolioById', () => {
    const mockPortfolio = {
      PORTFOLIOS_ID: portfolioId,
      USERS_ID: userId,
      NAME: 'Test Portfolio',
      CREATED_AT: mockCreatedDate
    };

    const mockHoldings = [
      {
        HOLDINGS_ID: holdingId,
        PORTFOLIOS_ID: portfolioId,
        ISIN: 'US0378331005',
        QUANTITY: 100,
        START_DATE: new Date(),
        END_DATE: null
      },
      {
        HOLDINGS_ID: 'holding456',
        PORTFOLIOS_ID: portfolioId,
        ISIN: 'US5949181045',
        QUANTITY: 50,
        START_DATE: new Date(),
        END_DATE: null
      }
    ];

    const mockTransactions = [
      {
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date(),
        AMOUNT: 100,
        PRICE: new Decimal(150),
        COMMISSION: new Decimal(0),
        BROKER: 'SYSTEM'
      }
    ];

    it('should return portfolio with holdings and calculations', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockHoldingRepo.findByPortfolio.resolves(mockHoldings);
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      const result = await portfolioService.getPortfolioById(portfolioId, userId);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: portfolioId,
        userId: userId,
        name: 'Test Portfolio',
        createdAt: mockCreatedDate,
        updatedAt: mockCreatedDate
      });
      expect(result?.holdings).to.have.length(2);
      expect(result?.holdings[0]).to.deep.include({
        id: holdingId,
        stockId: mockHoldings[0].ISIN,
        quantity: mockHoldings[0].QUANTITY,
        currentValue: mockQuote.price * mockHoldings[0].QUANTITY
      });
    });

    it('should handle empty portfolio (no holdings)', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockHoldingRepo.findByPortfolio.resolves([]);

      const result = await portfolioService.getPortfolioById(portfolioId, userId);

      expect(result).to.not.be.null;
      expect(result?.holdings).to.be.an('array').that.is.empty;
      expect(result?.totalValue).to.equal(0);
      expect(result?.totalGainLoss).to.equal(0);
      expect(result?.totalGainLossPercentage).to.equal(0);
    });

    it('should calculate total values correctly with multiple holdings', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockHoldingRepo.findByPortfolio.resolves(mockHoldings);
      mockTransactionRepo.findByHolding.resolves([{
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date(),
        AMOUNT: 100,
        PRICE: new Decimal(100),
        COMMISSION: new Decimal(0),
        BROKER: 'SYSTEM'
      }]);

      const result = await portfolioService.getPortfolioById(portfolioId, userId);

      const expectedTotalValue = mockQuote.price * (mockHoldings[0].QUANTITY + mockHoldings[1].QUANTITY);
      expect(result?.totalValue).to.be.closeTo(expectedTotalValue, 0.01);
    });
  });

  describe('updatePortfolio', () => {
    const mockUpdateData: UpdatePortfolioDTO = {
      name: 'Updated Portfolio'
    };

    const mockPortfolio = {
      PORTFOLIOS_ID: portfolioId,
      USERS_ID: userId,
      NAME: 'Test Portfolio',
      CREATED_AT: mockCreatedDate
    };

    it('should update portfolio name if authorized', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockPortfolioRepo.update.resolves({
        ...mockPortfolio,
        NAME: mockUpdateData.name
      });

      const result = await portfolioService.updatePortfolio(portfolioId, userId, mockUpdateData);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: portfolioId,
        name: mockUpdateData.name,
        createdAt: mockCreatedDate,
        updatedAt: mockCreatedDate
      });
      expect(mockPortfolioRepo.update.calledOnceWith(portfolioId, {
        NAME: mockUpdateData.name
      })).to.be.true;
    });

    it('should preserve existing name if not provided in update', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockPortfolioRepo.update.resolves(mockPortfolio);

      const result = await portfolioService.updatePortfolio(portfolioId, userId, {});

      expect(result?.name).to.equal(mockPortfolio.NAME);
    });
  });

  describe('deletePortfolio', () => {
    const mockPortfolio = {
      PORTFOLIOS_ID: portfolioId,
      USERS_ID: userId,
      NAME: 'Test Portfolio',
      CREATED_AT: mockCreatedDate
    };

    it('should delete portfolio and return void if authorized', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockPortfolioRepo.delete.resolves();

      const result = await portfolioService.deletePortfolio(portfolioId, userId);

      expect(result).to.be.undefined;
      expect(mockPortfolioRepo.delete.calledOnceWith(portfolioId)).to.be.true;
    });

    it('should throw error with correct message if unauthorized', async () => {
      mockPortfolioRepo.findById.resolves({
        ...mockPortfolio,
        USERS_ID: 'different-user'
      });

      try {
        await portfolioService.deletePortfolio(portfolioId, userId);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Portfolio not found or unauthorized');
      }
    });
  });

  describe('getPortfolioSummary', () => {
    const mockPortfolio = {
      PORTFOLIOS_ID: portfolioId,
      USERS_ID: userId,
      NAME: 'Test Portfolio',
      CREATED_AT: mockCreatedDate
    };

    const mockHoldings = [
      {
        HOLDINGS_ID: holdingId,
        PORTFOLIOS_ID: portfolioId,
        ISIN: 'US0378331005',
        QUANTITY: 100,
        START_DATE: new Date(),
        END_DATE: null
      }
    ];

    const mockTransactions = [
      {
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date(),
        AMOUNT: 100,
        PRICE: new Decimal(100),
        COMMISSION: new Decimal(0),
        BROKER: 'SYSTEM'
      }
    ];

    it('should return correct summary with calculations', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockHoldingRepo.findByPortfolio.resolves(mockHoldings);
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      const result = await portfolioService.getPortfolioSummary(portfolioId, userId);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: portfolioId,
        name: mockPortfolio.NAME,
        holdingsCount: 1
      });
      
      const expectedTotalValue = mockQuote.price * mockHoldings[0].QUANTITY;
      const expectedTotalCost = 100 * mockHoldings[0].QUANTITY; // Price * Quantity from mockTransactions
      const expectedGainLoss = expectedTotalValue - expectedTotalCost;
      const expectedGainLossPercentage = (expectedGainLoss / expectedTotalCost) * 100;

      expect(result?.totalValue).to.be.closeTo(expectedTotalValue, 0.01);
      expect(result?.totalGainLoss).to.be.closeTo(expectedGainLoss, 0.01);
      expect(result?.totalGainLossPercentage).to.be.closeTo(expectedGainLossPercentage, 0.01);
    });

    it('should handle empty portfolio in summary', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockHoldingRepo.findByPortfolio.resolves([]);

      const result = await portfolioService.getPortfolioSummary(portfolioId, userId);

      expect(result).to.deep.include({
        id: portfolioId,
        name: mockPortfolio.NAME,
        holdingsCount: 0,
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0
      });
    });
  });
});
