import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import * as holdingService from '../../../src/services/holdingService';
import * as stockService from '../../../src/services/stockService';
import * as quoteService from '../../../src/services/quoteService';
import { CreateHoldingDTO, UpdateHoldingDTO } from '../../../src/models/Holding';
import { Transaction } from '@prisma/client';
import { 
  mockHoldingRepo,
  mockTransactionRepo,
  setupRepositoryMocks, 
  resetRepositoryMocks,
  createDecimal 
} from '../../helpers/mockRepositories';

use(chaiAsPromised);

describe('HoldingService', () => {
  let stockServiceStub: sinon.SinonStub;
  let quoteServiceStub: sinon.SinonStub;

  beforeEach(() => {
    setupRepositoryMocks();
    
    // Set the repository instances in the service using the new setter methods
    holdingService.setHoldingRepository(mockHoldingRepo);
    holdingService.setTransactionRepository(mockTransactionRepo);
    
    // Stub service dependencies
    stockServiceStub = sinon.stub(stockService, 'getStockByIsin');
    quoteServiceStub = sinon.stub(quoteService, 'getLatestQuotes');
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  const mockHolding = {
    holding_id: '1',
    portfolio_id: '1',
    isin: 'US0378331005',
    quantity: 10,
    start_date: new Date('2023-01-01'),
    end_date: null
  };

  const mockStock = {
    id: '1',
    symbol: 'AAPL',
    isin: 'US0378331005',
    name: 'Apple Inc.',
    currency: 'USD',
    exchange: 'NASDAQ',
    country: 'USA',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockQuote = {
    id: '1',
    stockId: '1',
    price: 150.50,
    currency: 'USD',
    timestamp: new Date()
  };

  describe('createHolding', () => {
    const mockCreateData: CreateHoldingDTO = {
      portfolio_id: '1',
      isin: 'US0378331005',
      quantity: 10,
      price: 150.50
    };

    it('should create a holding with initial transaction', async () => {
      stockServiceStub.resolves(mockStock);
      quoteServiceStub.resolves([mockQuote]);
      mockHoldingRepo.create.resolves(mockHolding);
      
      const mockTransaction: Transaction = {
        transaction_id: '1',
        holding_id: '1',
        buy: true,
        amount: 10,
        price: createDecimal(150.50),
        transaction_time: new Date(),
        commission: createDecimal(0),
        broker: 'SYSTEM'
      };
      
      mockTransactionRepo.create.resolves(mockTransaction);
      mockTransactionRepo.findByHoldingId.resolves([mockTransaction]);

      const result = await holdingService.createHolding(mockCreateData);

      expect(result).to.deep.include({
        holding_id: mockHolding.holding_id,
        portfolio_id: mockHolding.portfolio_id,
        isin: mockHolding.isin,
        quantity: mockHolding.quantity,
        stock: {
          symbol: mockStock.symbol,
          name: mockStock.name,
          currency: mockStock.currency
        },
        currentPrice: mockQuote.price,
        totalValue: mockQuote.price * mockHolding.quantity
      });

      expect(mockHoldingRepo.create.firstCall.args[0]).to.deep.include({
        holding_id: '',
        portfolio_id: mockCreateData.portfolio_id,
        isin: mockCreateData.isin,
        quantity: mockCreateData.quantity,
        end_date: null
      });

      const createTransactionCall = mockTransactionRepo.create.firstCall.args[0];
      expect(createTransactionCall).to.deep.include({
        transaction_id: '',
        holding_id: mockHolding.holding_id,
        buy: true,
        amount: mockCreateData.quantity,
        broker: 'SYSTEM'
      });
      expect(createTransactionCall.price.toString()).to.equal('150.5');
      expect(createTransactionCall.commission.toString()).to.equal('0');
    });

    it('should throw error if stock not found', async () => {
      stockServiceStub.resolves(null);

      await expect(holdingService.createHolding(mockCreateData))
        .to.be.rejectedWith('Stock not found');
    });
  });

  describe('getHoldingById', () => {
    it('should return holding if found', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      stockServiceStub.resolves(mockStock);
      quoteServiceStub.resolves([mockQuote]);
      mockTransactionRepo.findByHoldingId.resolves([]);

      const result = await holdingService.getHoldingById('1');

      expect(result).to.deep.include({
        holding_id: mockHolding.holding_id,
        portfolio_id: mockHolding.portfolio_id,
        isin: mockHolding.isin,
        quantity: mockHolding.quantity,
        stock: {
          symbol: mockStock.symbol,
          name: mockStock.name,
          currency: mockStock.currency
        },
        currentPrice: mockQuote.price,
        totalValue: mockQuote.price * mockHolding.quantity
      });
    });

    it('should return null if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      const result = await holdingService.getHoldingById('999');
      expect(result).to.be.null;
    });
  });

  describe('updateHolding', () => {
    const mockUpdateData: UpdateHoldingDTO = {
      quantity: 15
    };

    const updatedMockHolding = {
      ...mockHolding,
      quantity: 15
    };

    it('should update holding successfully', async () => {
      mockHoldingRepo.update.resolves(updatedMockHolding);
      stockServiceStub.resolves(mockStock);
      quoteServiceStub.resolves([mockQuote]);
      mockTransactionRepo.findByHoldingId.resolves([]);

      const result = await holdingService.updateHolding('1', mockUpdateData);

      expect(result.quantity).to.equal(mockUpdateData.quantity);
      expect(mockHoldingRepo.update.firstCall.args).to.deep.equal([
        '1',
        { quantity: mockUpdateData.quantity }
      ]);
    });

    it('should throw error if quantity is not provided', async () => {
      await expect(holdingService.updateHolding('1', {} as UpdateHoldingDTO))
        .to.be.rejectedWith('Quantity is required for update');
    });
  });

  describe('closeHolding', () => {
    it('should close holding successfully', async () => {
      mockHoldingRepo.update.resolves({} as any);

      await holdingService.closeHolding('1');

      expect(mockHoldingRepo.update.calledWith('1', { end_date: sinon.match.date })).to.be.true;
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.update.rejects(new Error('Holding not found'));

      await expect(holdingService.closeHolding('999'))
        .to.be.rejectedWith('Holding not found');
    });
  });

  describe('getHoldingPerformance', () => {
    it('should return performance metrics for a holding', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      stockServiceStub.resolves(mockStock);
      quoteServiceStub.resolves([mockQuote]);
      mockTransactionRepo.findByHoldingId.resolves([]);

      const result = await holdingService.getHoldingPerformance('1');

      expect(result).to.have.all.keys([
        'totalReturn',
        'percentageReturn',
        'annualizedReturn',
        'holdingPeriod'
      ]);
      expect(result.holdingPeriod).to.be.a('number');
      expect(result.totalReturn).to.be.a('number');
      expect(result.percentageReturn).to.be.a('number');
      expect(result.annualizedReturn).to.be.a('number');
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      await expect(holdingService.getHoldingPerformance('999'))
        .to.be.rejectedWith('Holding not found');
    });
  });

  describe('getHoldingTransactions', () => {
    const mockTransactions = [{
      transaction_id: '1',
      holding_id: '1',
      buy: true,
      amount: 10,
      price: createDecimal(150.50),
      transaction_time: new Date(),
      commission: createDecimal(5.00),
      broker: 'Example Broker'
    }];

    it('should return transactions for a holding', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockTransactionRepo.findByHoldingId.resolves(mockTransactions);

      const result = await holdingService.getHoldingTransactions('1');

      expect(result).to.deep.equal(mockTransactions);
      expect(mockTransactionRepo.findByHoldingId.calledWith('1')).to.be.true;
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      await expect(holdingService.getHoldingTransactions('999'))
        .to.be.rejectedWith('Holding not found');
    });
  });

  describe('getHoldingValue', () => {
    it('should return value metrics for a holding', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      stockServiceStub.resolves(mockStock);
      quoteServiceStub.resolves([mockQuote]);
      mockTransactionRepo.findByHoldingId.resolves([{
        transaction_id: '1',
        holding_id: '1',
        buy: true,
        amount: 10,
        price: createDecimal(150.50),
        transaction_time: new Date(),
        commission: createDecimal(0),
        broker: 'SYSTEM'
      }]);

      const result = await holdingService.getHoldingValue('1');

      expect(result).to.have.all.keys([
        'currentValue',
        'costBasis',
        'unrealizedGainLoss',
        'unrealizedGainLossPercentage'
      ]);
      expect(result.currentValue).to.equal(mockQuote.price * mockHolding.quantity);
      expect(result.costBasis).to.equal(1505.00);
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      await expect(holdingService.getHoldingValue('999'))
        .to.be.rejectedWith('Holding not found');
    });
  });

  describe('getHoldingHistory', () => {
    const mockHistoricalQuotes = {
      symbol: 'AAPL',
      interval: '1d',
      quotes: [
        {
          date: new Date('2023-01-01'),
          open: 150.00,
          high: 151.00,
          low: 149.00,
          close: 150.50,
          adjustedClose: 150.50,
          volume: 1000000
        },
        {
          date: new Date('2023-01-02'),
          open: 150.50,
          high: 152.00,
          low: 150.00,
          close: 151.50,
          adjustedClose: 151.50,
          volume: 1100000
        }
      ]
    };

    beforeEach(() => {
      sinon.stub(quoteService, 'getHistoricalQuotes').resolves(mockHistoricalQuotes);
    });

    it('should return historical data for a holding', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);

      const result = await holdingService.getHoldingHistory('1');

      expect(result).to.be.an('array');
      expect(result[0]).to.have.all.keys(['date', 'price', 'value']);
      expect(result[0].value).to.equal(mockHistoricalQuotes.quotes[0].close * mockHolding.quantity);
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      await expect(holdingService.getHoldingHistory('999'))
        .to.be.rejectedWith('Holding not found');
    });
  });
});
