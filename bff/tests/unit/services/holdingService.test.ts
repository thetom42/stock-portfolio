import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import { Decimal } from '@prisma/client/runtime/library';
import { 
  mockHoldingRepo, 
  mockPortfolioRepo, 
  mockTransactionRepo,
  mockStockRepo,
  setupRepositoryMocks, 
  resetRepositoryMocks 
} from '../../helpers/mockRepositories';
import * as holdingService from '../../../src/services/holdingService';
import * as quoteService from '../../../src/services/quoteService';
import { CreateHoldingDTO, UpdateHoldingDTO, Holding } from '../../../src/models/Holding';
import { Transaction } from '../../../src/models/Transaction';

use(spies);

describe('HoldingService', () => {
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

    const mockStock = {
      ISIN: 'US0378331005',
      SYMBOL: 'AAPL',
      NAME: 'Apple Inc.',
      WKN: '123456'
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
      mockStockRepo.findByISIN.resolves(mockStock);
      mockHoldingRepo.create.resolves(mockCreatedHolding);
      mockTransactionRepo.create.resolves({} as Transaction);

      const result = await holdingService.createHolding(userId, mockCreateDTO);

      expect(mockPortfolioRepo.findById).to.have.been.called();
      expect(mockStockRepo.findByISIN).to.have.been.called();
      expect(mockHoldingRepo.create).to.have.been.called();
      expect(mockTransactionRepo.create).to.have.been.called();
      expect(result).to.deep.include({
        ...mockCreatedHolding,
        stock: {
          symbol: mockStock.SYMBOL.toLowerCase(),
          name: mockStock.NAME,
          currency: 'USD'
        }
      });
    });

    it('should throw Unauthorized if portfolio belongs to different user', async () => {
      mockPortfolioRepo.findById.resolves({
        ...mockPortfolio,
        USERS_ID: 'different-user'
      });

      try {
        await holdingService.createHolding(userId, mockCreateDTO);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Unauthorized');
      }
    });

    it('should throw Stock not found if stock does not exist', async () => {
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockStockRepo.findByISIN.resolves(null);

      try {
        await holdingService.createHolding(userId, mockCreateDTO);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Stock not found');
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

    const mockStock = {
      ISIN: 'US0378331005',
      SYMBOL: 'AAPL',
      NAME: 'Apple Inc.',
      WKN: '123456'
    };

    it('should throw Holding not found if holding does not exist', async () => {
      mockHoldingRepo.findById.resolves(null);

      try {
        await holdingService.getHoldingById(userId, holdingId);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Holding not found');
      }
    });

    it('should throw Unauthorized if portfolio belongs to different user', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({
        ...mockPortfolio,
        USERS_ID: 'different-user'
      });

      try {
        await holdingService.getHoldingById(userId, holdingId);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Unauthorized');
      }
    });

    it('should return holding details with calculations', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves(mockPortfolio);
      mockStockRepo.findByISIN.resolves(mockStock);
      mockTransactionRepo.findByHolding.resolves([{
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date(),
        AMOUNT: 100,
        PRICE: new Decimal(150),
        COMMISSION: new Decimal(0),
        BROKER: 'SYSTEM'
      }]);

      const result = await holdingService.getHoldingById(userId, holdingId);

      expect(result).to.deep.include({
        ...mockHolding,
        stock: {
          symbol: mockStock.SYMBOL.toLowerCase(),
          name: mockStock.NAME,
          currency: 'USD'
        },
        currentPrice: mockQuote.price
      });
      expect(result.totalValue).to.equal(mockQuote.price * mockHolding.QUANTITY);
    });
  });

  describe('getHoldingPerformance', () => {
    const mockHolding: Holding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: portfolioId,
      ISIN: 'US0378331005',
      QUANTITY: 100,
      START_DATE: new Date(),
      END_DATE: null
    };

    const mockTransactions = [
      {
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date(),
        AMOUNT: 50,
        PRICE: new Decimal(100),
        COMMISSION: new Decimal(0),
        BROKER: 'SYSTEM'
      },
      {
        TRANSACTIONS_ID: 'trans2',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date(),
        AMOUNT: 50,
        PRICE: new Decimal(200),
        COMMISSION: new Decimal(0),
        BROKER: 'SYSTEM'
      }
    ];

    it('should calculate performance metrics correctly', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockStockRepo.findByISIN.resolves({
        ISIN: mockHolding.ISIN,
        SYMBOL: 'AAPL',
        NAME: 'Apple Inc.'
      });
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      const result = await holdingService.getHoldingPerformance(userId, holdingId);

      expect(result.totalInvested).to.equal(15000); // (50 * 100) + (50 * 200)
      expect(result.currentValue).to.equal(16050); // 100 * 160.50 (mockQuote.price)
      expect(result.totalReturn).to.equal(1050); // 16050 - 15000
      expect(result.totalReturnPercentage).to.equal(7); // (1050 / 15000) * 100
      expect(result.transactions).to.have.length(2);
    });
  });

  describe('getHoldingHistory', () => {
    const mockHolding: Holding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: portfolioId,
      ISIN: 'US0378331005',
      QUANTITY: 100,
      START_DATE: new Date(),
      END_DATE: null
    };

    const mockTransactions = [
      {
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date('2023-01-01'),
        AMOUNT: 50,
        PRICE: new Decimal(100),
        COMMISSION: new Decimal(1.5),
        BROKER: 'SYSTEM'
      },
      {
        TRANSACTIONS_ID: 'trans2',
        HOLDINGS_ID: holdingId,
        BUY: false,
        TRANSACTION_TIME: new Date('2023-02-01'),
        AMOUNT: 25,
        PRICE: new Decimal(150),
        COMMISSION: new Decimal(1.5),
        BROKER: 'SYSTEM'
      }
    ];

    it('should return transaction history', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      const result = await holdingService.getHoldingHistory(userId, holdingId);

      expect(result).to.have.length(2);
      expect(result[0]).to.deep.include({
        buy: true,
        amount: 50,
        price: 100,
        value: 5000,
        commission: 1.5,
        broker: 'SYSTEM'
      });
      expect(result[1]).to.deep.include({
        buy: false,
        amount: 25,
        price: 150,
        value: 3750,
        commission: 1.5,
        broker: 'SYSTEM'
      });
    });

    it('should throw Unauthorized if portfolio belongs to different user', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: 'different-user' });

      try {
        await holdingService.getHoldingHistory(userId, holdingId);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Unauthorized');
      }
    });
  });
});
