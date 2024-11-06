import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import { 
  mockHoldingRepo, 
  mockPortfolioRepo, 
  mockTransactionRepo, 
  setupRepositoryMocks, 
  resetRepositoryMocks 
} from '../../helpers/mockRepositories';
import * as holdingService from '../../../src/services/holdingService';
import { CreateHoldingDTO, UpdateHoldingDTO, Holding, Transaction } from '../../../src/models/Holding';

use(spies);

describe('HoldingService', () => {
  const userId = 'user123';
  const portfolioId = 'portfolio123';
  const holdingId = 'holding123';

  beforeEach(() => {
    setupRepositoryMocks();
  });

  afterEach(() => {
    resetRepositoryMocks();
  });

  describe('createHolding', () => {
    const mockCreateDTO: CreateHoldingDTO = {
      PORTFOLIOS_ID: portfolioId,
      ISIN: 'US0378331005',
      QUANTITY: 100,
      PRICE: 150.50
    };

    const mockPortfolio = {
      PORTFOLIOS_ID: portfolioId,
      USERS_ID: userId,
      NAME: 'Test Portfolio'
    };

    const mockCreatedHolding: Holding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: portfolioId,
      ISIN: 'US0378331005',
      QUANTITY: 100,
      START_DATE: new Date(),
      END_DATE: null
    };

    it('should create a holding with initial transaction', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockHoldingRepo.create.resolves(mockCreatedHolding);
      mockTransactionRepo.create.resolves({} as Transaction);

      const result = await holdingService.createHolding(userId, mockCreateDTO);

      expect(mockPortfolioRepo.findById).to.have.been.called();
      expect(mockHoldingRepo.create).to.have.been.called();
      expect(mockTransactionRepo.create).to.have.been.called();
      expect(result).to.deep.equal(mockCreatedHolding);
    });

    it('should throw error if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      try {
        await holdingService.createHolding(userId, mockCreateDTO);
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
        await holdingService.createHolding(userId, mockCreateDTO);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Portfolio not found or unauthorized');
      }
    });
  });

  describe('getHoldingById', () => {
    const mockHolding: Holding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: portfolioId,
      ISIN: 'US0378331005',
      QUANTITY: 100,
      START_DATE: new Date(),
      END_DATE: null
    };

    const mockPortfolio = {
      PORTFOLIOS_ID: portfolioId,
      USERS_ID: userId,
      NAME: 'Test Portfolio'
    };

    it('should return holding details if found and authorized', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves(mockPortfolio);

      const result = await holdingService.getHoldingById(holdingId, userId);

      expect(mockHoldingRepo.findById).to.have.been.called();
      expect(mockPortfolioRepo.findById).to.have.been.called();
      expect(result).to.include({
        HOLDINGS_ID: holdingId,
        PORTFOLIOS_ID: portfolioId
      });
    });

    it('should return null if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      const result = await holdingService.getHoldingById(holdingId, userId);

      expect(result).to.be.null;
    });

    it('should return null if portfolio not found', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves(null);

      const result = await holdingService.getHoldingById(holdingId, userId);

      expect(result).to.be.null;
    });
  });

  describe('updateHolding', () => {
    const mockUpdateDTO: UpdateHoldingDTO = {
      QUANTITY: 150
    };

    const mockHolding: Holding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: portfolioId,
      ISIN: 'US0378331005',
      QUANTITY: 100,
      START_DATE: new Date(),
      END_DATE: null
    };

    it('should update holding if authorized', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockHoldingRepo.update.resolves({ ...mockHolding, ...mockUpdateDTO });

      const result = await holdingService.updateHolding(holdingId, userId, mockUpdateDTO);

      expect(mockHoldingRepo.update).to.have.been.called();
      expect(result).to.include({ QUANTITY: mockUpdateDTO.QUANTITY });
    });

    it('should return null if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      const result = await holdingService.updateHolding(holdingId, userId, mockUpdateDTO);

      expect(result).to.be.null;
    });
  });

  describe('getHoldingPerformance', () => {
    const mockTransactions: Transaction[] = [
      {
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date(),
        AMOUNT: 100,
        PRICE: 150,
        COMMISSION: 0,
        BROKER: 'SYSTEM'
      }
    ];

    it('should return performance metrics', async () => {
      mockHoldingRepo.findById.resolves({ PORTFOLIOS_ID: portfolioId });
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      const result = await holdingService.getHoldingPerformance(holdingId, userId);

      expect(result).to.not.be.null;
      expect(result?.totalInvested).to.equal(15000); // 100 * 150
      expect(mockTransactionRepo.findByHolding).to.have.been.called();
    });

    it('should return null if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      const result = await holdingService.getHoldingPerformance(holdingId, userId);

      expect(result).to.be.null;
    });
  });

  describe('getHoldingValue', () => {
    const mockTransactions: Transaction[] = [
      {
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date(),
        AMOUNT: 100,
        PRICE: 150,
        COMMISSION: 0,
        BROKER: 'SYSTEM'
      }
    ];

    const mockHolding: Holding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: portfolioId,
      ISIN: 'US0378331005',
      QUANTITY: 100,
      START_DATE: new Date(),
      END_DATE: null
    };

    it('should return holding value details', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      const result = await holdingService.getHoldingValue(holdingId, userId);

      expect(result).to.not.be.null;
      expect(result?.quantity).to.equal(100);
      expect(result?.costBasis).to.equal(15000); // 100 * 150
      expect(result?.averageCost).to.equal(150); // 15000 / 100
    });

    it('should return null if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      const result = await holdingService.getHoldingValue(holdingId, userId);

      expect(result).to.be.null;
    });
  });
});
