import 'mocha';
import { expect } from 'chai';
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
import { YahooFinanceQuote, IntradayQuote, HistoricalQuote } from '../../../src/services/yahooFinanceService';

describe('QuoteService', () => {
  const mockStock = {
    ISIN: 'US0378331005',
    SYMBOL: 'AAPL',
    NAME: 'Apple Inc.',
    WKN: '123456'
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
      mockStockRepo.findByISIN.resolves(mockStock);
      const mockDBQuote = {
        QUOTES_ID: '123',
        ISIN: mockStock.ISIN,
        PRICE: new Decimal(mockYahooQuote.price),
        CURRENCY: mockYahooQuote.currency,
        MARKET_TIME: new Date(mockYahooQuote.timestamp),
        EXCHANGE: mockYahooQuote.exchange
      };
      mockQuoteRepo.create.resolves(mockDBQuote);
      mockQuoteRepo.findLatestByStock.resolves(null);

      const result = await quoteService.getRealTimeQuote(mockStock.ISIN);

      expect(result).to.have.property('price', mockYahooQuote.price);
      expect(result).to.have.property('change');
      expect(result).to.have.property('changePercent');
      expect(result).to.have.property('timestamp');
      sinon.assert.calledWith(mockStockRepo.findByISIN, mockStock.ISIN);
    });

    it('should use cached quote if not stale', async () => {
      mockStockRepo.findByISIN.resolves(mockStock);
      const freshQuote = {
        QUOTES_ID: '123',
        ISIN: mockStock.ISIN,
        PRICE: new Decimal(150.50),
        CURRENCY: 'USD',
        MARKET_TIME: new Date(), // Current time
        EXCHANGE: 'NASDAQ'
      };
      mockQuoteRepo.findLatestByStock.resolves(freshQuote);

      const result = await quoteService.getRealTimeQuote(mockStock.ISIN);

      expect(result).to.have.property('price', Number(freshQuote.PRICE));
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      sinon.assert.notCalled(yahooService.getRealTimeQuote);
    });

    it('should fetch new quote if cached quote is stale', async () => {
      mockStockRepo.findByISIN.resolves(mockStock);
      const staleQuote = {
        QUOTES_ID: '123',
        ISIN: mockStock.ISIN,
        PRICE: new Decimal(150.50),
        CURRENCY: 'USD',
        MARKET_TIME: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes old
        EXCHANGE: 'NASDAQ'
      };
      mockQuoteRepo.findLatestByStock.resolves(staleQuote);
      mockQuoteRepo.create.resolves({
        ...staleQuote,
        PRICE: new Decimal(mockYahooQuote.price),
        MARKET_TIME: new Date(mockYahooQuote.timestamp)
      });

      const result = await quoteService.getRealTimeQuote(mockStock.ISIN);

      expect(result).to.have.property('price', mockYahooQuote.price);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      sinon.assert.called(yahooService.getRealTimeQuote);
    });

    it('should throw error if stock not found', async () => {
      mockStockRepo.findByISIN.resolves(null);

      try {
        await quoteService.getRealTimeQuote('invalid-isin');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Stock not found');
      }
    });

    it('should handle Yahoo Finance API errors', async () => {
      mockStockRepo.findByISIN.resolves(mockStock);
      mockQuoteRepo.findLatestByStock.resolves(null);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.getRealTimeQuote.rejects(new Error('API Error'));

      try {
        await quoteService.getRealTimeQuote(mockStock.ISIN);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Failed to fetch quote data');
      }
    });
  });

  describe('getHistoricalQuotes', () => {
    const interval: QuoteInterval = {
      interval: '1d',
      range: '1mo'
    };

    it('should return historical quotes for valid stock', async () => {
      mockStockRepo.findByISIN.resolves(mockStock);

      const result = await quoteService.getHistoricalQuotes(mockStock.ISIN, interval);

      expect(result).to.have.property('symbol', mockStock.SYMBOL);
      expect(result).to.have.property('interval', interval.interval);
      expect(result).to.have.property('quotes').that.is.an('array');
      expect(result.quotes[0]).to.have.all.keys(
        'date', 'open', 'high', 'low', 'close', 'adjustedClose', 'volume'
      );
      sinon.assert.calledWith(mockStockRepo.findByISIN, mockStock.ISIN);
    });

    it('should throw error if stock not found', async () => {
      mockStockRepo.findByISIN.resolves(null);

      try {
        await quoteService.getHistoricalQuotes('invalid-isin', interval);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Stock not found');
      }
    });

    it('should handle Yahoo Finance API errors', async () => {
      mockStockRepo.findByISIN.resolves(mockStock);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.getHistoricalQuotes.rejects(new Error('API Error'));

      try {
        await quoteService.getHistoricalQuotes(mockStock.ISIN, interval);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Failed to fetch historical data');
      }
    });
  });

  describe('getLatestQuotes', () => {
    it('should return latest quotes for multiple stocks', async () => {
      const mockDBQuote = {
        QUOTES_ID: '123',
        ISIN: mockStock.ISIN,
        PRICE: new Decimal(150.50),
        CURRENCY: 'USD',
        MARKET_TIME: new Date(),
        EXCHANGE: 'NASDAQ'
      };
      mockQuoteRepo.findLatestByStock.resolves(mockDBQuote);

      const result = await quoteService.getLatestQuotes([mockStock.ISIN]);

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockDBQuote.QUOTES_ID,
        stockId: mockDBQuote.ISIN,
        price: Number(mockDBQuote.PRICE),
        currency: mockDBQuote.CURRENCY
      });
      sinon.assert.calledWith(mockQuoteRepo.findLatestByStock, mockStock.ISIN);
    });

    it('should return empty array for empty input', async () => {
      const result = await quoteService.getLatestQuotes([]);
      expect(result).to.be.an('array').that.is.empty;
      sinon.assert.notCalled(mockQuoteRepo.findLatestByStock);
    });
  });

  describe('getIntradayQuotes', () => {
    it('should return intraday quotes for valid stock', async () => {
      mockStockRepo.findByISIN.resolves(mockStock);

      const result = await quoteService.getIntradayQuotes(mockStock.ISIN);

      expect(result).to.be.an('array');
      expect(result[0]).to.have.all.keys(
        'price', 'timestamp', 'volume', 'open', 'high', 'low', 'close'
      );
      sinon.assert.calledWith(mockStockRepo.findByISIN, mockStock.ISIN);
    });

    it('should throw error if stock not found', async () => {
      mockStockRepo.findByISIN.resolves(null);

      try {
        await quoteService.getIntradayQuotes('invalid-isin');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Stock not found');
      }
    });

    it('should handle Yahoo Finance API errors', async () => {
      mockStockRepo.findByISIN.resolves(mockStock);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.getIntradayQuotes.rejects(new Error('API Error'));

      try {
        await quoteService.getIntradayQuotes(mockStock.ISIN);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.equal('Failed to fetch intraday data');
      }
    });
  });

  describe('getQuoteHistory', () => {
    const startDate = new Date('2023-01-01');
    const endDate = new Date('2023-12-31');

    it('should return quote history for valid date range', async () => {
      const mockDBQuotes = [{
        QUOTES_ID: '123',
        ISIN: mockStock.ISIN,
        PRICE: new Decimal(150.50),
        CURRENCY: 'USD',
        MARKET_TIME: new Date(),
        EXCHANGE: 'NASDAQ'
      }];
      mockQuoteRepo.findByStockAndTimeRange.resolves(mockDBQuotes);

      const result = await quoteService.getQuoteHistory(
        mockStock.ISIN,
        startDate,
        endDate
      );

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockDBQuotes[0].QUOTES_ID,
        stockId: mockDBQuotes[0].ISIN,
        price: Number(mockDBQuotes[0].PRICE),
        currency: mockDBQuotes[0].CURRENCY
      });
      sinon.assert.calledWith(mockQuoteRepo.findByStockAndTimeRange, 
        mockStock.ISIN, 
        startDate, 
        endDate
      );
    });

    it('should return empty array if no quotes found', async () => {
      mockQuoteRepo.findByStockAndTimeRange.resolves([]);

      const result = await quoteService.getQuoteHistory(
        mockStock.ISIN,
        startDate,
        endDate
      );

      expect(result).to.be.an('array').that.is.empty;
    });
  });
});
