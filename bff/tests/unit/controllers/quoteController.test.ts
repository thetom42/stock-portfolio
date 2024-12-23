import { expect } from 'chai';
import sinon from 'sinon';
import { quoteService } from '../../../src/services/quoteService';
import * as quoteController from '../../../src/controllers/quoteController';
import { Quote, HistoricalQuote } from '../../../src/models/Quote';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
describe('QuoteController', () => {
  // Date matcher for response verification
  const dateMatcher = { kind: 'date' };

  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;
  beforeEach(() => {
    res = createMockResponse();
    next = sinon.spy();
    // Stub quoteService methods
    sinon.stub(quoteService, 'getRealTimeQuote');
    sinon.stub(quoteService, 'getHistoricalQuotes');
    sinon.stub(quoteService, 'getLatestQuotes');
    sinon.stub(quoteService, 'getIntradayQuotes');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getLatestQuote', () => {
    const timestamp = new Date();
    const mockQuote = {
      id: '1',
      stockId: 'US0378331005',
      price: 150.50,
      currency: 'USD',
      timestamp,
      change: 1.50,
      changePercent: 1.0
    };

    it('should return cached quote if not stale', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      const now = new Date();
      (quoteService.getLatestQuotes as sinon.SinonStub).resolves([{
        ...mockQuote,
        timestamp: now
      }]);

      await quoteController.getLatestQuote(req as any, res as any, next);

      verifyResponse(res, 200, { ...mockQuote, timestamp: dateMatcher });
    });

    it('should fetch new quote if cached quote is stale', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      const staleDate = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
      (quoteService.getLatestQuotes as sinon.SinonStub).resolves([{
        ...mockQuote,
        timestamp: staleDate
      }]);
      (quoteService.getRealTimeQuote as sinon.SinonStub).resolves({
        ...mockQuote,
        timestamp: new Date()
      });

      await quoteController.getLatestQuote(req as any, res as any, next);

      verifyResponse(res, 200, { ...mockQuote, timestamp: dateMatcher });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      const error = new Error('Failed to fetch quote data');
      (quoteService.getLatestQuotes as sinon.SinonStub).resolves([]);
      (quoteService.getRealTimeQuote as sinon.SinonStub).rejects(error);

      await quoteController.getLatestQuote(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getQuoteHistory', () => {
    const mockHistoricalQuotes = [{
      id: '1',
      stockId: 'US0378331005',
      price: 150.50,
      currency: 'USD',
      timestamp: new Date(),
      change: 1.50,
      changePercent: 1.0
    }];

    it('should return quote history', async () => {
      req = createMockRequest({
        params: { isin: 'US0378331005' },
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      });
      (quoteService.getHistoricalQuotes as sinon.SinonStub).resolves({
        quotes: mockHistoricalQuotes
      });

      await quoteController.getQuoteHistory(req as any, res as any, next);

      verifyResponse(res, 200, {
        quotes: mockHistoricalQuotes.map(quote => ({
          ...quote,
          timestamp: dateMatcher
        }))
      });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { isin: 'US0378331005' },
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        }
      });
      const error = new Error('Failed to fetch historical data');
      (quoteService.getHistoricalQuotes as sinon.SinonStub).rejects(error);

      await quoteController.getQuoteHistory(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getIntradayQuotes', () => {
    const mockIntradayQuotes = [{
      id: '1',
      stockId: 'US0378331005',
      price: 150.50,
      currency: 'USD',
      timestamp: new Date(),
      change: 1.50,
      changePercent: 1.0
    }];

    it('should return intraday quotes', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      (quoteService.getIntradayQuotes as sinon.SinonStub).resolves(mockIntradayQuotes);

      await quoteController.getIntradayQuotes(req as any, res as any, next);

      verifyResponse(res, 200, {
        quotes: mockIntradayQuotes.map(quote => ({
          ...quote,
          timestamp: dateMatcher
        }))
      });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      const error = new Error('Failed to fetch intraday data');
      (quoteService.getIntradayQuotes as sinon.SinonStub).rejects(error);

      await quoteController.getIntradayQuotes(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
