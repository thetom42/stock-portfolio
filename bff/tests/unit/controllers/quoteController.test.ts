import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chai from 'chai';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express-serve-static-core';
import * as quoteController from '../../../src/controllers/quoteController';
import * as database from '../../../src/utils/database';
import * as yahooFinanceService from '../../../src/services/yahooFinanceService';
import { createMockPrismaClient } from '../../helpers/mockPrisma';
import { RealTimeQuote, QuoteHistory } from '../../../src/models/Quote';

chai.use(sinonChai);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('QuoteController', () => {
  let req: Partial<ExpressRequest>;
  let res: MockResponse;
  let next: sinon.SinonSpy;
  let statusStub: sinon.SinonSpy;
  let jsonStub: sinon.SinonSpy;
  let sendStub: sinon.SinonSpy;
  let mockPrismaClient: any;
  let mockYahooFinanceService: any;

  beforeEach(() => {
    statusStub = sinon.spy((code: number) => res);
    jsonStub = sinon.spy();
    sendStub = sinon.spy();
    
    res = {
      status: statusStub,
      json: jsonStub,
      send: sendStub
    };
    next = sinon.spy();

    mockPrismaClient = createMockPrismaClient();
    sinon.stub(database, 'getPrismaClient').returns(mockPrismaClient);

    mockYahooFinanceService = {
      getRealTimeQuote: sinon.stub(),
      getHistoricalQuotes: sinon.stub(),
      getIntradayQuotes: sinon.stub()
    };
    sinon.stub(yahooFinanceService, 'getYahooFinanceService').returns(mockYahooFinanceService);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getLatestQuote', () => {
    const mockQuote: RealTimeQuote = {
      price: 150.50,
      change: 1.50,
      changePercent: 1.0,
      timestamp: new Date()
    };

    const mockDBQuote = {
      QUOTES_ID: '1',
      ISIN: 'US0378331005',
      PRICE: mockQuote.price,
      CURRENCY: 'USD',
      MARKET_TIME: new Date(),
      EXCHANGE: 'NASDAQ'
    };

    it('should return cached quote if not stale', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as any;

      mockPrismaClient.quote.findFirst.resolves(mockDBQuote);

      await quoteController.getLatestQuote(req as any, res as any, next);

      expect(jsonStub).to.have.been.called;
      expect(jsonStub.firstCall.args[0]).to.deep.equal(mockDBQuote);
    });

    it('should fetch new quote if cached quote is stale', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as any;

      mockPrismaClient.quote.findFirst.resolves(null);
      mockYahooFinanceService.getRealTimeQuote.resolves(mockQuote);
      mockPrismaClient.quote.create.resolves(mockDBQuote);

      await quoteController.getLatestQuote(req as any, res as any, next);

      expect(mockYahooFinanceService.getRealTimeQuote).to.have.been.calledWith('US0378331005');
      expect(mockPrismaClient.quote.create).to.have.been.called;
      expect(jsonStub.firstCall.args[0]).to.deep.equal(mockDBQuote);
    });

    it('should handle errors gracefully', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as any;

      const error = new Error('Failed to fetch quote');
      mockPrismaClient.quote.findFirst.rejects(error);

      await quoteController.getLatestQuote(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });

  describe('getQuoteHistory', () => {
    const mockHistory: QuoteHistory = {
      symbol: 'AAPL',
      interval: '1d',
      quotes: [
        {
          date: new Date(),
          open: 150.00,
          high: 151.00,
          low: 149.00,
          close: 150.50,
          adjustedClose: 150.50,
          volume: 1000000
        }
      ]
    };

    it('should return quote history', async () => {
      req = {
        params: { isin: 'US0378331005' },
        query: { interval: '1d', range: '1mo' }
      } as any;

      mockYahooFinanceService.getHistoricalQuotes.resolves(mockHistory);

      await quoteController.getQuoteHistory(req as any, res as any, next);

      expect(jsonStub).to.have.been.calledWith(mockHistory);
    });

    it('should handle errors gracefully', async () => {
      req = {
        params: { isin: 'US0378331005' },
        query: { interval: '1d', range: '1mo' }
      } as any;

      const error = new Error('Failed to fetch quote history');
      mockYahooFinanceService.getHistoricalQuotes.rejects(error);

      await quoteController.getQuoteHistory(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });

  describe('getIntradayQuotes', () => {
    const mockIntradayQuotes = [
      {
        price: 150.50,
        timestamp: new Date()
      }
    ];

    it('should return intraday quotes', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as any;

      mockYahooFinanceService.getIntradayQuotes.resolves(mockIntradayQuotes);

      await quoteController.getIntradayQuotes(req as any, res as any, next);

      expect(jsonStub).to.have.been.calledWith(mockIntradayQuotes);
    });

    it('should handle errors gracefully', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as any;

      const error = new Error('Failed to fetch intraday quotes');
      mockYahooFinanceService.getIntradayQuotes.rejects(error);

      await quoteController.getIntradayQuotes(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });
});
