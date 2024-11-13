import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import * as holdingService from '../../../src/services/holdingService';
import * as stockService from '../../../src/services/stockService';
import * as quoteService from '../../../src/services/quoteService';
import { CreateHoldingDTO, UpdateHoldingDTO } from '../../../src/models/Holding';
import { Transaction } from '../../../../db/models/Transaction';
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
    stockServiceStub = sinon.stub(stockService, 'getStockByISIN');
    quoteServiceStub = sinon.stub(quoteService, 'getLatestQuotes');
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  const mockHolding = {
    HOLDINGS_ID: '1',
    PORTFOLIOS_ID: '1',
    ISIN: 'US0378331005',
    QUANTITY: 10,
    START_DATE: new Date('2023-01-01'),
    END_DATE: null
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
      PORTFOLIOS_ID: '1',
      ISIN: 'US0378331005',
      QUANTITY: 10,
      PRICE: 150.50
    };

    it('should create a holding with initial transaction', async () => {
      stockServiceStub.resolves(mockStock);
      quoteServiceStub.resolves([mockQuote]);
      mockHoldingRepo.create.resolves(mockHolding);
      
      const mockTransaction: Transaction = {
        TRANSACTIONS_ID: '1',
        HOLDINGS_ID: '1',
        BUY: true,
        AMOUNT: 10,
        PRICE: createDecimal(150.50),
        TRANSACTION_TIME: new Date(),
        COMMISSION: createDecimal(0),
        BROKER: 'SYSTEM'
      };
      
      mockTransactionRepo.create.resolves(mockTransaction);
      mockTransactionRepo.getTotalValue.resolves(createDecimal(1505.00));

      const result = await holdingService.createHolding(mockCreateData);

      expect(result).to.deep.include({
        HOLDINGS_ID: mockHolding.HOLDINGS_ID,
        PORTFOLIOS_ID: mockHolding.PORTFOLIOS_ID,
        ISIN: mockHolding.ISIN,
        QUANTITY: mockHolding.QUANTITY,
        stock: {
          symbol: mockStock.symbol,
          name: mockStock.name,
          currency: mockStock.currency
        },
        currentPrice: mockQuote.price,
        totalValue: mockQuote.price * mockHolding.QUANTITY
      });

      expect(mockHoldingRepo.create.firstCall.args[0]).to.deep.include({
        HOLDINGS_ID: '',
        PORTFOLIOS_ID: mockCreateData.PORTFOLIOS_ID,
        ISIN: mockCreateData.ISIN,
        QUANTITY: mockCreateData.QUANTITY,
        END_DATE: null
      });

      const createTransactionCall = mockTransactionRepo.create.firstCall.args[0];
      expect(createTransactionCall).to.deep.include({
        TRANSACTIONS_ID: '',
        HOLDINGS_ID: mockHolding.HOLDINGS_ID,
        BUY: true,
        AMOUNT: mockCreateData.QUANTITY,
        BROKER: 'SYSTEM'
      });
      expect(createTransactionCall.PRICE.toString()).to.equal('150.5');
      expect(createTransactionCall.COMMISSION.toString()).to.equal('0');
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
      mockTransactionRepo.getTotalValue.resolves(createDecimal(1505.00));
      mockTransactionRepo.findByHolding.resolves([]);

      const result = await holdingService.getHoldingById('1');

      expect(result).to.deep.include({
        HOLDINGS_ID: mockHolding.HOLDINGS_ID,
        PORTFOLIOS_ID: mockHolding.PORTFOLIOS_ID,
        ISIN: mockHolding.ISIN,
        QUANTITY: mockHolding.QUANTITY,
        stock: {
          symbol: mockStock.symbol,
          name: mockStock.name,
          currency: mockStock.currency
        },
        currentPrice: mockQuote.price,
        totalValue: mockQuote.price * mockHolding.QUANTITY
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
      QUANTITY: 15
    };

    const updatedMockHolding = {
      ...mockHolding,
      QUANTITY: 15
    };

    it('should update holding successfully', async () => {
      mockHoldingRepo.updateQuantity.resolves(updatedMockHolding);
      stockServiceStub.resolves(mockStock);
      quoteServiceStub.resolves([mockQuote]);
      mockTransactionRepo.getTotalValue.resolves(createDecimal(2257.50));
      mockTransactionRepo.findByHolding.resolves([]);

      const result = await holdingService.updateHolding('1', mockUpdateData);

      expect(result.QUANTITY).to.equal(mockUpdateData.QUANTITY);
      expect(mockHoldingRepo.updateQuantity.firstCall.args).to.deep.equal([
        '1',
        mockUpdateData.QUANTITY
      ]);
    });

    it('should throw error if quantity is not provided', async () => {
      await expect(holdingService.updateHolding('1', {} as UpdateHoldingDTO))
        .to.be.rejectedWith('Quantity is required for update');
    });
  });

  describe('closeHolding', () => {
    it('should close holding successfully', async () => {
      mockHoldingRepo.closeHolding.resolves({} as any);

      await holdingService.closeHolding('1');

      expect(mockHoldingRepo.closeHolding.calledWith('1', sinon.match.date)).to.be.true;
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.closeHolding.rejects(new Error('Holding not found'));

      await expect(holdingService.closeHolding('999'))
        .to.be.rejectedWith('Holding not found');
    });

    it('should throw error if holding is already closed', async () => {
      mockHoldingRepo.closeHolding.rejects(new Error('Holding is already closed'));

      await expect(holdingService.closeHolding('1'))
        .to.be.rejectedWith('Holding is already closed');
    });
  });

  describe('getHoldingPerformance', () => {
    it('should return performance metrics for a holding', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      stockServiceStub.resolves(mockStock);
      quoteServiceStub.resolves([mockQuote]);
      mockTransactionRepo.getTotalValue.resolves(createDecimal(1505.00));
      mockTransactionRepo.findByHolding.resolves([]);

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
      TRANSACTIONS_ID: '1',
      HOLDINGS_ID: '1',
      BUY: true,
      AMOUNT: 10,
      PRICE: createDecimal(150.50),
      TRANSACTION_TIME: new Date(),
      COMMISSION: createDecimal(5.00),
      BROKER: 'Example Broker'
    }];

    it('should return transactions for a holding', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      const result = await holdingService.getHoldingTransactions('1');

      expect(result).to.deep.equal(mockTransactions);
      expect(mockTransactionRepo.findByHolding.calledWith('1')).to.be.true;
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
      mockTransactionRepo.getTotalValue.resolves(createDecimal(1505.00));
      mockTransactionRepo.findByHolding.resolves([]);

      const result = await holdingService.getHoldingValue('1');

      expect(result).to.have.all.keys([
        'currentValue',
        'costBasis',
        'unrealizedGainLoss',
        'unrealizedGainLossPercentage'
      ]);
      expect(result.currentValue).to.equal(mockQuote.price * mockHolding.QUANTITY);
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
      expect(result[0].value).to.equal(mockHistoricalQuotes.quotes[0].close * mockHolding.QUANTITY);
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      await expect(holdingService.getHoldingHistory('999'))
        .to.be.rejectedWith('Holding not found');
    });
  });
});
