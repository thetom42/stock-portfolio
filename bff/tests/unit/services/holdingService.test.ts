import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { holdingService, setHoldingRepository, setTransactionRepository } from '../../../src/services/holdingService';
import { stockService } from '../../../src/services/stockService';
import { quoteService } from '../../../src/services/quoteService';
import { CreateHoldingDTO, UpdateHoldingDTO } from '../../../src/models/Holding';
import { setupMockHoldingAndTransactionRepos, resetAllMocks } from '../../helpers/mockRepositories';
import { Decimal } from '@prisma/client/runtime/library';

describe('HoldingService', () => {
  let mockHoldingRepo: any;
  let mockTransactionRepo: any;

  beforeEach(() => {
    const setup = setupMockHoldingAndTransactionRepos();
    mockHoldingRepo = setup.mockHoldingRepo;
    mockTransactionRepo = setup.mockTransactionRepo;

    // Inject mock repositories into the singleton instance
    setHoldingRepository(mockHoldingRepo);
    setTransactionRepository(mockTransactionRepo);

    // Stub external service calls
    sinon.stub(stockService, 'getStockByIsin').resolves({
      id: 'US0378331005',
      isin: 'US0378331005',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currency: 'USD',
      exchange: 'NASDAQ',
      country: 'US',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    sinon.stub(quoteService, 'getLatestQuotes').resolves([{
      id: '1',
      stockId: 'US0378331005',
      price: 150.50,
      currency: 'USD',
      timestamp: new Date()
    }]);

    sinon.stub(quoteService, 'getHistoricalQuotes').resolves({
      symbol: 'AAPL',
      interval: '1d',
      quotes: [{
        date: new Date(),
        open: 150.00,
        high: 151.00,
        low: 149.00,
        close: 150.50,
        adjustedClose: 150.50,
        volume: 1000000
      }]
    });
  });

  afterEach(() => {
    resetAllMocks();
    sinon.restore();
  });

  describe('createHolding', () => {
    const mockCreateData: CreateHoldingDTO = {
      portfolioId: '1',
      isin: 'US0378331005',
      quantity: 10,
      price: 150.50
    };

    const mockDBHolding = {
      holding_id: '1',
      portfolio_id: mockCreateData.portfolioId,
      isin: mockCreateData.isin,
      quantity: mockCreateData.quantity,
      start_date: new Date(),
      end_date: null
    };

    it('should create holding successfully', async () => {
      mockHoldingRepo.create.resolves(mockDBHolding);
      mockTransactionRepo.create.resolves({
        transaction_id: '1',
        holding_id: '1',
        buy: true,
        amount: mockCreateData.quantity,
        price: new Decimal(mockCreateData.price),
        transaction_time: new Date(),
        commission: new Decimal(0),
        broker: 'SYSTEM'
      });

      // Mock findByHoldingId for calculateTotalValue
      mockTransactionRepo.findByHoldingId.resolves([{
        transaction_id: '1',
        holding_id: '1',
        buy: true,
        amount: mockCreateData.quantity,
        price: new Decimal(mockCreateData.price),
        transaction_time: new Date(),
        commission: new Decimal(0),
        broker: 'SYSTEM'
      }]);

      const result = await holdingService.createHolding(mockCreateData);

      expect(result).to.deep.include({
        id: mockDBHolding.holding_id,
        portfolioId: mockDBHolding.portfolio_id,
        isin: mockDBHolding.isin,
        quantity: mockDBHolding.quantity
      });
    });

    it('should throw error if stock not found', async () => {
      (stockService.getStockByIsin as sinon.SinonStub).resolves(null);

      await expect(holdingService.createHolding(mockCreateData))
        .to.be.rejectedWith('Stock not found');
    });
  });

  describe('getHoldingById', () => {
    it('should return holding if found', async () => {
      const mockDBHolding = {
        holding_id: '1',
        portfolio_id: '1',
        isin: 'US0378331005',
        quantity: 10,
        start_date: new Date(),
        end_date: null
      };

      mockHoldingRepo.findById.resolves(mockDBHolding);
      mockTransactionRepo.findByHoldingId.resolves([]);

      const result = await holdingService.getHoldingById('1');

      expect(result).to.deep.include({
        id: mockDBHolding.holding_id,
        portfolioId: mockDBHolding.portfolio_id,
        isin: mockDBHolding.isin,
        quantity: mockDBHolding.quantity
      });
    });

    it('should return null if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      const result = await holdingService.getHoldingById('999');
      expect(result).to.be.null;
    });
  });

  describe('updateHolding', () => {
    const updateData: UpdateHoldingDTO = {
      quantity: 20
    };

    it('should update holding successfully', async () => {
      const mockDBHolding = {
        holding_id: '1',
        portfolio_id: '1',
        isin: 'US0378331005',
        quantity: updateData.quantity,
        start_date: new Date(),
        end_date: null
      };

      mockHoldingRepo.update.resolves(mockDBHolding);
      mockTransactionRepo.findByHoldingId.resolves([]);

      const result = await holdingService.updateHolding('1', updateData);

      expect(result).to.deep.include({
        id: mockDBHolding.holding_id,
        portfolioId: mockDBHolding.portfolio_id,
        quantity: updateData.quantity
      });
    });

    it('should throw error if quantity not provided', async () => {
      await expect(holdingService.updateHolding('1', {} as UpdateHoldingDTO))
        .to.be.rejectedWith('Quantity is required for update');
    });
  });

  describe('closeHolding', () => {
    it('should close holding successfully', async () => {
      mockHoldingRepo.update.resolves({
        holding_id: '1',
        portfolio_id: '1',
        isin: 'US0378331005',
        quantity: 10,
        start_date: new Date(),
        end_date: new Date()
      });

      await holdingService.closeHolding('1');

      expect(mockHoldingRepo.update.calledWith('1', { end_date: sinon.match.date })).to.be.true;
    });

    it('should handle errors gracefully', async () => {
      mockHoldingRepo.update.rejects(new Error('Failed to close holding'));

      await expect(holdingService.closeHolding('1'))
        .to.be.rejectedWith('Failed to close holding');
    });
  });

  describe('getHoldingPerformance', () => {
    it('should return performance metrics', async () => {
      const mockDBHolding = {
        holding_id: '1',
        portfolio_id: '1',
        isin: 'US0378331005',
        quantity: 10,
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end_date: null
      };

      mockHoldingRepo.findById.resolves(mockDBHolding);
      mockTransactionRepo.findByHoldingId.resolves([{
        transaction_id: '1',
        holding_id: '1',
        buy: true,
        amount: 10,
        price: new Decimal(140),
        transaction_time: new Date(),
        commission: new Decimal(0),
        broker: 'SYSTEM'
      }]);

      const result = await holdingService.getHoldingPerformance('1');

      expect(result).to.have.all.keys([
        'totalReturn',
        'percentageReturn',
        'annualizedReturn',
        'holdingPeriod'
      ]);
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      await expect(holdingService.getHoldingPerformance('999'))
        .to.be.rejectedWith('Holding not found');
    });
  });

  describe('getHoldingTransactions', () => {
    it('should return transactions for holding', async () => {
      mockHoldingRepo.findById.resolves({
        holding_id: '1',
        portfolio_id: '1',
        isin: 'US0378331005',
        quantity: 10,
        start_date: new Date(),
        end_date: null
      });

      const mockDBTransaction = {
        transaction_id: '1',
        holding_id: '1',
        buy: true,
        amount: 10,
        price: new Decimal(150.50),
        transaction_time: new Date(),
        commission: new Decimal(0),
        broker: 'SYSTEM'
      };

      mockTransactionRepo.findByHoldingId.resolves([mockDBTransaction]);

      const result = await holdingService.getHoldingTransactions('1');

      expect(result[0]).to.deep.include({
        id: mockDBTransaction.transaction_id,
        holdingId: mockDBTransaction.holding_id,
        buy: mockDBTransaction.buy,
        amount: mockDBTransaction.amount,
        price: Number(mockDBTransaction.price)
      });
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      await expect(holdingService.getHoldingTransactions('999'))
        .to.be.rejectedWith('Holding not found');
    });
  });

  describe('getHoldingValue', () => {
    it('should return current value and metrics', async () => {
      const mockDBHolding = {
        holding_id: '1',
        portfolio_id: '1',
        isin: 'US0378331005',
        quantity: 10,
        start_date: new Date(),
        end_date: null
      };

      mockHoldingRepo.findById.resolves(mockDBHolding);
      mockTransactionRepo.findByHoldingId.resolves([{
        transaction_id: '1',
        holding_id: '1',
        buy: true,
        amount: 10,
        price: new Decimal(140),
        transaction_time: new Date(),
        commission: new Decimal(0),
        broker: 'SYSTEM'
      }]);

      const result = await holdingService.getHoldingValue('1');

      expect(result).to.have.all.keys([
        'currentValue',
        'costBasis',
        'unrealizedGainLoss',
        'unrealizedGainLossPercentage'
      ]);
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      await expect(holdingService.getHoldingValue('999'))
        .to.be.rejectedWith('Holding not found');
    });
  });

  describe('getHoldingHistory', () => {
    it('should return historical data', async () => {
      const mockDBHolding = {
        holding_id: '1',
        portfolio_id: '1',
        isin: 'US0378331005',
        quantity: 10,
        start_date: new Date(),
        end_date: null
      };

      mockHoldingRepo.findById.resolves(mockDBHolding);

      const result = await holdingService.getHoldingHistory('1');

      expect(result).to.be.an('array');
      expect(result[0]).to.have.all.keys(['date', 'price', 'value']);
      expect(result[0].price).to.equal(150.50);
      expect(result[0].value).to.equal(150.50 * mockDBHolding.quantity);
      expect((quoteService.getHistoricalQuotes as sinon.SinonStub).calledWith(mockDBHolding.isin, {
        interval: '1d',
        range: '1y'
      })).to.be.true;
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      await expect(holdingService.getHoldingHistory('999'))
        .to.be.rejectedWith('Holding not found');
    });
  });
});
