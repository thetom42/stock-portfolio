import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import { 
  mockPortfolioRepo,
  mockHoldingRepo,
  mockTransactionRepo,
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
      CREATED_AT: new Date()
    };

    it('should create a portfolio successfully', async () => {
      mockPortfolioRepo.create.resolves(mockCreatedPortfolio);

      const result = await portfolioService.createPortfolio(userId, mockPortfolioData);

      expect(result).to.deep.include({
        id: portfolioId,
        userId: userId,
        name: mockPortfolioData.name
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
      CREATED_AT: new Date()
    }];

    it('should return user portfolios', async () => {
      mockPortfolioRepo.findByUserId.resolves(mockPortfolios);

      const result = await portfolioService.getPortfoliosByUserId(userId);

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: portfolioId,
        userId: userId,
        name: 'Test Portfolio'
      });
    });
  });

  describe('getPortfolioById', () => {
    const mockPortfolio = {
      PORTFOLIOS_ID: portfolioId,
      USERS_ID: userId,
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    const mockHolding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: portfolioId,
      ISIN: 'US0378331005',
      QUANTITY: 100,
      START_DATE: new Date(),
      END_DATE: null
    };

    const mockTransactions = [{
      TRANSACTIONS_ID: 'trans1',
      HOLDINGS_ID: holdingId,
      BUY: true,
      TRANSACTION_TIME: new Date(),
      AMOUNT: 100,
      PRICE: 150,
      COMMISSION: 0,
      BROKER: 'SYSTEM'
    }];

    it('should return portfolio with details if found and authorized', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockHoldingRepo.findByPortfolio.resolves([mockHolding]);
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      const result = await portfolioService.getPortfolioById(portfolioId, userId);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: portfolioId,
        userId: userId,
        name: 'Test Portfolio'
      });
      expect(result?.holdings).to.be.an('array');
      expect(result?.holdings[0]).to.deep.include({
        id: holdingId,
        stockId: mockHolding.ISIN,
        quantity: mockHolding.QUANTITY,
        currentValue: mockQuote.price * mockHolding.QUANTITY
      });
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.getPortfolioById(portfolioId, userId);
      expect(result).to.be.null;
    });

    it('should return null if portfolio belongs to different user', async () => {
      mockPortfolioRepo.findById.resolves({
        ...mockPortfolio,
        USERS_ID: 'different-user'
      });

      const result = await portfolioService.getPortfolioById(portfolioId, userId);
      expect(result).to.be.null;
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
      CREATED_AT: new Date()
    };

    it('should update portfolio if authorized', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockPortfolioRepo.update.resolves({
        ...mockPortfolio,
        NAME: mockUpdateData.name
      });

      const result = await portfolioService.updatePortfolio(portfolioId, userId, mockUpdateData);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: portfolioId,
        name: mockUpdateData.name
      });
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.updatePortfolio(portfolioId, userId, mockUpdateData);
      expect(result).to.be.null;
    });

    it('should return null if portfolio belongs to different user', async () => {
      mockPortfolioRepo.findById.resolves({
        ...mockPortfolio,
        USERS_ID: 'different-user'
      });

      const result = await portfolioService.updatePortfolio(portfolioId, userId, mockUpdateData);
      expect(result).to.be.null;
    });
  });

  describe('deletePortfolio', () => {
    const mockPortfolio = {
      PORTFOLIOS_ID: portfolioId,
      USERS_ID: userId,
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    it('should delete portfolio if authorized', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockPortfolioRepo.delete.resolves();

      await portfolioService.deletePortfolio(portfolioId, userId);
      expect(mockPortfolioRepo.delete.calledOnceWith(portfolioId)).to.be.true;
    });

    it('should throw error if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      try {
        await portfolioService.deletePortfolio(portfolioId, userId);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Portfolio not found or unauthorized');
      }
    });

    it('should throw error if portfolio belongs to different user', async () => {
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
      CREATED_AT: new Date()
    };

    const mockHolding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: portfolioId,
      ISIN: 'US0378331005',
      QUANTITY: 100,
      START_DATE: new Date(),
      END_DATE: null
    };

    const mockTransactions = [{
      TRANSACTIONS_ID: 'trans1',
      HOLDINGS_ID: holdingId,
      BUY: true,
      TRANSACTION_TIME: new Date(),
      AMOUNT: 100,
      PRICE: 150,
      COMMISSION: 0,
      BROKER: 'SYSTEM'
    }];

    it('should return portfolio summary if authorized', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockHoldingRepo.findByPortfolio.resolves([mockHolding]);
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      const result = await portfolioService.getPortfolioSummary(portfolioId, userId);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: portfolioId,
        name: mockPortfolio.NAME,
        holdingsCount: 1
      });
      expect(result?.totalValue).to.equal(mockQuote.price * mockHolding.QUANTITY);
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.getPortfolioSummary(portfolioId, userId);
      expect(result).to.be.null;
    });

    it('should return null if portfolio belongs to different user', async () => {
      mockPortfolioRepo.findById.resolves({
        ...mockPortfolio,
        USERS_ID: 'different-user'
      });

      const result = await portfolioService.getPortfolioSummary(portfolioId, userId);
      expect(result).to.be.null;
    });
  });
});
