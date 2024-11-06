import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import { Request, Response } from 'express';
import * as quoteController from '../../../src/controllers/quoteController';
import { Quote, RealTimeQuote, HistoricalQuote } from '../../../src/models/Quote';
import { mockHoldingRepo, mockPortfolioRepo, setupRepositoryMocks, resetRepositoryMocks } from '../../helpers/mockRepositories';

use(spies);

// Mock Yahoo Finance Service
const mockYahooFinanceService = {
  getRealTimeQuote: sinon.stub(),
  getHistoricalQuotes: sinon.stub(),
  getIntradayQuotes: sinon.stub()
};

// Mock Quote Repository
const mockQuoteRepo = {
  findLatestByStock: sinon.stub(),
  create: sinon.stub(),
  findById: sinon.stub()
};

// Mock the getYahooFinanceService function
const mockGetYahooFinanceService = sinon.stub().returns(mockYahooFinanceService);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
};

describe('QuoteController', () => {
  let req: Partial<Request>;
  let res: MockResponse;
  let next: any;

  const userId = 'user123';
  const isin = 'US0378331005';

  beforeEach(() => {
    setupRepositoryMocks();
    res = {
      status: chai.spy(function(this: MockResponse, code: number) { return this; }),
      json: chai.spy()
    };
    next = chai.spy();
  });

  afterEach(() => {
    resetRepositoryMocks();
    chai.spy.restore();
    sinon.restore();
  });

  describe('getLatestQuote', () => {
    const mockQuote: Quote = {
      id: 'quote123',
      stockId: 'stock123',
      price: 150.50,
      currency: 'USD',
      timestamp: new Date()
    };

    const mockRealTimeQuote: RealTimeQuote = {
      price: 151.00,
      change: 0.50,
      changePercent: 0.33,
      timestamp: new Date()
    };

    it('should return cached quote if not stale', async () => {
      req = {
        params: { isin }
      } as any;

      mockQuote.timestamp = new Date(); // Fresh quote
      mockQuoteRepo.findLatestByStock.resolves(mockQuote);

      await quoteController.getLatestQuote(req as any, res as any, next);

      expect(mockQuoteRepo.findLatestByStock).to.have.been.called();
      expect(mockYahooFinanceService.getRealTimeQuote).to.not.have.been.called();
      expect(res.json).to.have.been.called.with(mockQuote);
    });

    it('should fetch new quote if stale', async () => {
      req = {
        params: { isin }
      } as any;

      mockQuote.timestamp = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes old
      mockQuoteRepo.findLatestByStock.resolves(mockQuote);
      mockYahooFinanceService.getRealTimeQuote.resolves(mockRealTimeQuote);
      mockQuoteRepo.create.resolves({ ...mockQuote, price: mockRealTimeQuote.price });

      await quoteController.getLatestQuote(req as any, res as any, next);

      expect(mockYahooFinanceService.getRealTimeQuote).to.have.been.called();
      expect(mockQuoteRepo.create).to.have.been.called();
    });
  });

  describe('getQuoteHistory', () => {
    const mockHistory = {
      symbol: 'AAPL',
      interval: '1d',
      quotes: [
        {
          date: new Date(),
          open: 150,
          high: 152,
          low: 149,
          close: 151,
          adjustedClose: 151,
          volume: 1000000
        }
      ] as HistoricalQuote[]
    };

    it('should return quote history', async () => {
      req = {
        params: { isin },
        query: { interval: '1d', range: '1mo' }
      } as any;

      mockYahooFinanceService.getHistoricalQuotes.resolves(mockHistory);

      await quoteController.getQuoteHistory(req as any, res as any, next);

      expect(mockYahooFinanceService.getHistoricalQuotes).to.have.been.called();
      expect(res.json).to.have.been.called.with(mockHistory);
    });
  });

  describe('getPortfolioQuotes', () => {
    const portfolioId = 'portfolio123';
    const mockHoldings = [
      { ISIN: 'US0378331005' },
      { ISIN: 'US5949181045' }
    ];

    const mockQuotes = [
      { id: 'quote1', stockId: 'stock1', price: 150, currency: 'USD', timestamp: new Date() },
      { id: 'quote2', stockId: 'stock2', price: 250, currency: 'USD', timestamp: new Date() }
    ];

    it('should return quotes for all holdings', async () => {
      req = {
        user: { id: userId },
        params: { portfolioId }
      } as any;

      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockHoldingRepo.findByPortfolio.resolves(mockHoldings);
      mockQuoteRepo.findLatestByStock.resolves(mockQuotes[0]);

      await quoteController.getPortfolioQuotes(req as any, res as any, next);

      expect(mockPortfolioRepo.findById).to.have.been.called();
      expect(mockHoldingRepo.findByPortfolio).to.have.been.called();
      expect(mockQuoteRepo.findLatestByStock).to.have.been.called();
      expect(res.json).to.have.been.called();
    });

    it('should return 403 if portfolio not owned by user', async () => {
      req = {
        user: { id: userId },
        params: { portfolioId }
      } as any;

      mockPortfolioRepo.findById.resolves({ USERS_ID: 'different-user' });

      await quoteController.getPortfolioQuotes(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(403);
      expect(res.json).to.have.been.called.with({ message: 'Unauthorized' });
    });
  });

  describe('getHoldingQuotes', () => {
    const holdingId = 'holding123';
    const mockHolding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: 'portfolio123',
      ISIN: 'US0378331005'
    };

    const mockHistory = {
      symbol: 'AAPL',
      interval: '1d',
      quotes: [] as HistoricalQuote[]
    };

    it('should return quote history for holding', async () => {
      req = {
        user: { id: userId },
        params: { holdingId },
        query: { range: '1mo' }
      } as any;

      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockYahooFinanceService.getHistoricalQuotes.resolves(mockHistory);

      await quoteController.getHoldingQuotes(req as any, res as any, next);

      expect(mockHoldingRepo.findById).to.have.been.called();
      expect(mockPortfolioRepo.findById).to.have.been.called();
      expect(mockYahooFinanceService.getHistoricalQuotes).to.have.been.called();
      expect(res.json).to.have.been.called.with(mockHistory);
    });

    it('should return 404 if holding not found', async () => {
      req = {
        user: { id: userId },
        params: { holdingId }
      } as any;

      mockHoldingRepo.findById.resolves(null);

      await quoteController.getHoldingQuotes(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Holding not found' });
    });
  });
});
