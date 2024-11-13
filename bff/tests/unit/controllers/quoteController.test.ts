import { expect } from 'chai';
import sinon from 'sinon';
import * as quoteService from '../../../src/services/quoteService';
import * as quoteController from '../../../src/controllers/quoteController';
import { Quote, HistoricalQuote } from '../../../src/models/Quote';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
import { setupRepositoryMocks, resetRepositoryMocks, mockQuoteRepo } from '../../helpers/mockRepositories';

describe('QuoteController', () => {
  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    setupRepositoryMocks();
    res = createMockResponse();
    next = sinon.spy();
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  describe('getLatestQuote', () => {
    const mockQuote: Quote = {
      id: '1',
      stockId: '1',
      price: 150.50,
      currency: 'USD',
      timestamp: new Date()
    };

    it('should return cached quote if not stale', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      sinon.stub(quoteService, 'getLatestQuotes').resolves([mockQuote]);

      await quoteController.getLatestQuote(req as any, res as any, next);

      verifyResponse(res, 200, mockQuote);
    });

    it('should fetch new quote if cached quote is stale', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      // First stub getLatestQuotes to return an empty array (no cached quote)
      sinon.stub(quoteService, 'getLatestQuotes').resolves([]);
      
      const realTimeQuote = {
        price: mockQuote.price,
        change: 1.5,
        changePercent: 1.0,
        timestamp: mockQuote.timestamp
      };
      sinon.stub(quoteService, 'getRealTimeQuote').resolves(realTimeQuote);

      await quoteController.getLatestQuote(req as any, res as any, next);

      verifyResponse(res, 200, realTimeQuote);
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      const error = new Error('Failed to fetch quote');
      sinon.stub(quoteService, 'getLatestQuotes').rejects(error);

      await quoteController.getLatestQuote(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getQuoteHistory', () => {
    const mockHistoricalQuotes: HistoricalQuote[] = [
      {
        date: new Date(),
        open: 150.00,
        high: 151.00,
        low: 149.50,
        close: 150.50,
        adjustedClose: 150.50,
        volume: 1000000
      }
    ];

    it('should return quote history', async () => {
      req = createMockRequest({
        params: { isin: 'US0378331005' },
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      });
      sinon.stub(quoteService, 'getHistoricalQuotes').resolves({
        symbol: 'AAPL',
        interval: '1d',
        quotes: mockHistoricalQuotes
      });

      await quoteController.getQuoteHistory(req as any, res as any, next);

      verifyResponse(res, 200, { quotes: mockHistoricalQuotes });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { isin: 'US0378331005' },
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      });
      const error = new Error('Failed to fetch quote history');
      sinon.stub(quoteService, 'getHistoricalQuotes').rejects(error);

      await quoteController.getQuoteHistory(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getIntradayQuotes', () => {
    const mockQuotes: Quote[] = [
      {
        id: '1',
        stockId: '1',
        price: 150.50,
        currency: 'USD',
        timestamp: new Date()
      }
    ];

    it('should return intraday quotes', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      sinon.stub(quoteService, 'getIntradayQuotes').resolves(mockQuotes);

      await quoteController.getIntradayQuotes(req as any, res as any, next);

      verifyResponse(res, 200, { quotes: mockQuotes });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      const error = new Error('Failed to fetch intraday quotes');
      sinon.stub(quoteService, 'getIntradayQuotes').rejects(error);

      await quoteController.getIntradayQuotes(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
