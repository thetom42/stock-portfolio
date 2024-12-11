import 'mocha';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { Decimal } from '@prisma/client/runtime/library';
import { 
  mockQuoteRepo, 
  mockStockRepo,
  setupRepositoryMocks, 
  resetRepositoryMocks 
} from '../../helpers/mockRepositories';
import * as quoteService from '../../../src/services/quoteService';
import * as yahooFinanceService from '../../../src/services/yahooFinanceService';
import { QuoteInterval } from '../../../src/models/Quote';
import { Stock } from '../../../../db/models/Stock';
import { YahooFinanceQuote, IntradayQuote, HistoricalQuote } from '../../../src/services/yahooFinanceService';

use(chaiAsPromised);

describe('QuoteService', () => {
  const mockStock: Stock = {
    isin: 'US0378331005',
    category_id: '1',
    name: 'Apple Inc.',
    wkn: '865985',
    symbol: 'AAPL'
  };

  const mockYahooQuote: YahooFinanceQuote = {
    price: 150.50,
    currency: 'USD',
    exchange: 'NASDAQ',
    timestamp: 1625097600000,
    volume: 1000000,
    open: 149.50,
    high: 152.00,
    low: 148.50,
    close: 150.50
  };

  const mockHistoricalQuote: HistoricalQuote = {
    date: new Date(),
    open: 149.50,
    high: 151.00,
    low: 149.00,
    close: 150.50,
    adjClose: 150.50,
    volume: 1000000
  };

  const mockIntradayQuote: IntradayQuote = {
    price: 150.50,
    timestamp: 1625097600000,
    volume: 1000000,
    open: 149.50,
    high: 152.00,
    low: 148.50,
    close: 150.50
  };

  beforeEach(() => {
    setupRepositoryMocks();
    // Use the new setter methods to inject mock repositories
    quoteService.setStockRepository(mockStockRepo);
    quoteService.setQuoteRepository(mockQuoteRepo);
    
    sinon.stub(yahooFinanceService, 'getYahooFinanceService').returns({
      getRealTimeQuote: sinon.stub().resolves(mockYahooQuote),
      getHistoricalQuotes: sinon.stub().resolves([mockHistoricalQuote]),
      getIntradayQuotes: sinon.stub().resolves([mockIntradayQuote])
    } as any);
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  describe('getRealTimeQuote', () => {
    it('should return real-time quote for valid stock', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);
      const mockDBQuote = {
        id: '123',
        isin: mockStock.isin,
        price: new Decimal(mockYahooQuote.price),
        currency: mockYahooQuote.currency,
        market_time: new Date(mockYahooQuote.timestamp),
        exchange: mockYahooQuote.exchange
      };
      mockQuoteRepo.create.resolves(mockDBQuote);
      mockQuoteRepo.findLatestByIsin.resolves(null);

      const result = await quoteService.getRealTimeQuote(mockStock.isin);

      expect(result).to.have.property('price', mockYahooQuote.price);
      expect(result).to.have.property('change');
      expect(result).to.have.property('changePercent');
      expect(result).to.have.property('timestamp');
      sinon.assert.calledWith(mockStockRepo.findByIsin, mockStock.isin);
    });

    it('should use cached quote if not stale', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);
      const freshQuote = {
        id: '123',
        isin: mockStock.isin,
        price: new Decimal(150.50),
        currency: 'USD',
        market_time: new Date(), // Current time
        exchange: 'NASDAQ'
      };
      mockQuoteRepo.findLatestByIsin.resolves(freshQuote);

      const result = await quoteService.getRealTimeQuote(mockStock.isin);

      expect(result).to.have.property('price', Number(freshQuote.price));
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      sinon.assert.notCalled(yahooService.getRealTimeQuote);
    });

    it('should fetch new quote if cached quote is stale', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);
      const staleQuote = {
        id: '123',
        isin: mockStock.isin,
        price: new Decimal(150.50),
        currency: 'USD',
        market_time: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes old
        exchange: 'NASDAQ'
      };
      mockQuoteRepo.findLatestByIsin.resolves(staleQuote);
      mockQuoteRepo.create.resolves({
        ...staleQuote,
        price: new Decimal(mockYahooQuote.price),
        market_time: new Date(mockYahooQuote.timestamp)
      });

      const result = await quoteService.getRealTimeQuote(mockStock.isin);

      expect(result).to.have.property('price', mockYahooQuote.price);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      sinon.assert.called(yahooService.getRealTimeQuote);
    });

    it('should throw error if stock not found', async () => {
      mockStockRepo.findByIsin.resolves(null);

      await expect(quoteService.getRealTimeQuote('invalid-isin'))
        .to.be.rejectedWith('Stock not found');
    });

    it('should handle Yahoo Finance API errors', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);
      mockQuoteRepo.findLatestByIsin.resolves(null);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.getRealTimeQuote.rejects(new Error('API Error'));

      await expect(quoteService.getRealTimeQuote(mockStock.isin))
        .to.be.rejectedWith('Failed to fetch quote data');
    });
  });

  describe('getHistoricalQuotes', () => {
    const interval: QuoteInterval = {
      interval: '1d',
      range: '1mo'
    };

    it('should return historical quotes for valid stock', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);

      const result = await quoteService.getHistoricalQuotes(mockStock.isin, interval);

      expect(result).to.have.property('symbol', mockStock.symbol);
      expect(result).to.have.property('interval', interval.interval);
      expect(result).to.have.property('quotes').that.is.an('array');
      expect(result.quotes[0]).to.have.all.keys(
        'date', 'open', 'high', 'low', 'close', 'adjustedClose', 'volume'
      );
      sinon.assert.calledWith(mockStockRepo.findByIsin, mockStock.isin);
    });

    it('should throw error if stock not found', async () => {
      mockStockRepo.findByIsin.resolves(null);

      await expect(quoteService.getHistoricalQuotes('invalid-isin', interval))
        .to.be.rejectedWith('Stock not found');
    });

    it('should handle Yahoo Finance API errors', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.getHistoricalQuotes.rejects(new Error('API Error'));

      await expect(quoteService.getHistoricalQuotes(mockStock.isin, interval))
        .to.be.rejectedWith('Failed to fetch historical data');
    });
  });

  describe('getLatestQuotes', () => {
    it('should return latest quotes for multiple stocks', async () => {
      const mockDBQuote = {
        id: '123',
        isin: mockStock.isin,
        price: new Decimal(150.50),
        currency: 'USD',
        market_time: new Date(),
        exchange: 'NASDAQ'
      };
      mockQuoteRepo.findLatestByIsin.resolves(mockDBQuote);

      const result = await quoteService.getLatestQuotes([mockStock.isin]);

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockDBQuote.id,
        stockId: mockDBQuote.isin,
        price: Number(mockDBQuote.price),
        currency: mockDBQuote.currency
      });
      sinon.assert.calledWith(mockQuoteRepo.findLatestByIsin, mockStock.isin);
    });

    it('should return empty array for empty input', async () => {
      // Reset the spy count before this specific test
      mockQuoteRepo.findLatestByIsin.resetHistory();
      
      const result = await quoteService.getLatestQuotes([]);
      expect(result).to.be.an('array').that.is.empty;
      sinon.assert.notCalled(mockQuoteRepo.findLatestByIsin);
    });
  });

  describe('getIntradayQuotes', () => {
    it('should return intraday quotes for valid stock', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);
      const mockDBQuote = {
        id: '123',
        isin: mockStock.isin,
        price: new Decimal(mockIntradayQuote.price),
        currency: 'USD',
        market_time: new Date(mockIntradayQuote.timestamp),
        exchange: 'YAHOO'
      };
      mockQuoteRepo.create.resolves(mockDBQuote);

      const result = await quoteService.getIntradayQuotes(mockStock.isin);

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockDBQuote.id,
        stockId: mockDBQuote.isin,
        price: Number(mockDBQuote.price),
        currency: mockDBQuote.currency,
        timestamp: mockDBQuote.market_time
      });
      sinon.assert.calledWith(mockStockRepo.findByIsin, mockStock.isin);
    });

    it('should throw error if stock not found', async () => {
      mockStockRepo.findByIsin.resolves(null);

      await expect(quoteService.getIntradayQuotes('invalid-isin'))
        .to.be.rejectedWith('Stock not found');
    });

    it('should handle Yahoo Finance API errors', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.getIntradayQuotes.rejects(new Error('API Error'));

      await expect(quoteService.getIntradayQuotes(mockStock.isin))
        .to.be.rejectedWith('Failed to fetch intraday data');
    });
  });

  describe('getQuoteHistory', () => {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-12-31');

    it('should return quote history for valid date range', async () => {
      const mockDBQuotes = [{
        id: '123',
        isin: mockStock.isin,
        price: new Decimal(150.50),
        currency: 'USD',
        market_time: new Date(),
        exchange: 'NASDAQ'
      }];
      mockQuoteRepo.findByDateRange.resolves(mockDBQuotes);

      const result = await quoteService.getQuoteHistory(
        mockStock.isin,
        startDate,
        endDate
      );

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockDBQuotes[0].id,
        stockId: mockDBQuotes[0].isin,
        price: Number(mockDBQuotes[0].price),
        currency: mockDBQuotes[0].currency
      });
      sinon.assert.calledWith(mockQuoteRepo.findByDateRange, 
        mockStock.isin, 
        startDate, 
        endDate
      );
    });

    it('should return empty array if no quotes found', async () => {
      mockQuoteRepo.findByDateRange.resolves([]);

      const result = await quoteService.getQuoteHistory(
        mockStock.isin,
        startDate,
        endDate
      );

      expect(result).to.be.an('array').that.is.empty;
    });
  });
});
