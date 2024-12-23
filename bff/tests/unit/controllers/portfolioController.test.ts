import { expect } from 'chai';
import sinon from 'sinon';
import { portfolioService } from '../../../src/services/portfolioService';
import * as portfolioController from '../../../src/controllers/portfolioController';
import { CreatePortfolioDTO, PortfolioDetails } from '../../../src/models/Portfolio';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
describe('PortfolioController', () => {
  // Date matcher for response verification
  const dateMatcher = { kind: 'date' };

  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;
  beforeEach(() => {
    res = createMockResponse();
    next = sinon.spy();
    // Stub portfolioService methods
    sinon.stub(portfolioService, 'createPortfolio');
    sinon.stub(portfolioService, 'getPortfolioById');
    sinon.stub(portfolioService, 'updatePortfolio');
    sinon.stub(portfolioService, 'deletePortfolio');
    sinon.stub(portfolioService, 'getPortfolioSummary');
    sinon.stub(portfolioService, 'getPortfolioPerformance');
    sinon.stub(portfolioService, 'getPortfolioHoldings');
    sinon.stub(portfolioService, 'getPortfolioAllocation');
    sinon.stub(portfolioService, 'getPortfolioReturns');
    sinon.stub(portfolioService, 'getPortfolioHistory');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createPortfolio', () => {
    const mockCreateData: CreatePortfolioDTO = {
      name: 'Test Portfolio',
      description: 'Test portfolio description'
    };

    it('should create a portfolio and return 201 status', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      const createdAt = new Date();
      (portfolioService.createPortfolio as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: mockCreateData.name,
        createdAt,
        updatedAt: createdAt
      });

      await portfolioController.createPortfolio(req as any, res as any, next);

      verifyResponse(res, 201, {
        portfolio: {
          id: '1',
          userId: 'user1',
          name: mockCreateData.name,
          createdAt,
          updatedAt: createdAt
        }
      });
    });

    it('should call next with error if creation fails', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      const error = new Error('Database error');
      (portfolioService.createPortfolio as sinon.SinonStub).rejects(error);

      await portfolioController.createPortfolio(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getPortfolio', () => {
    it('should return portfolio if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      const createdAt = new Date();
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt,
        updatedAt: createdAt
      });

      await portfolioController.getPortfolio(req as any, res as any, next);

      verifyResponse(res, 200, {
        portfolio: {
          id: '1',
          userId: 'user1',
          name: 'Test Portfolio',
          createdAt,
          updatedAt: createdAt
        }
      });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(null);

      await portfolioController.getPortfolio(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('updatePortfolio', () => {
    const mockUpdateData = {
      name: 'Updated Portfolio',
      description: 'Updated description'
    };

    it('should update portfolio and return updated data', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });

      const createdAt = new Date();
      (portfolioService.updatePortfolio as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Updated Portfolio',
        createdAt,
        updatedAt: createdAt
      });

      await portfolioController.updatePortfolio(req as any, res as any, next);

      verifyResponse(res, 200, {
        portfolio: {
          id: '1',
          userId: 'user1',
          name: 'Updated Portfolio',
          createdAt,
          updatedAt: createdAt
        }
      });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });

      (portfolioService.updatePortfolio as sinon.SinonStub).resolves(null);

      await portfolioController.updatePortfolio(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio and return 204 status', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      const createdAt = new Date();
      (portfolioService.deletePortfolio as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt,
        updatedAt: createdAt
      });

      await portfolioController.deletePortfolio(req as any, res as any, next);

      verifyResponse(res, 204);
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      (portfolioService.deletePortfolio as sinon.SinonStub).rejects(new Error('Portfolio not found'));

      await portfolioController.deletePortfolio(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioSummary', () => {
    it('should return portfolio summary if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioSummary as sinon.SinonStub).resolves({
        totalValue: 10000,
        totalGainLoss: 1000,
        totalGainLossPercentage: 10,
        numberOfHoldings: 5,
        topPerformers: [
          { id: '1', name: 'AAPL', gainLoss: 500, gainLossPercentage: 15 },
          { id: '2', name: 'MSFT', gainLoss: 300, gainLossPercentage: 12 }
        ]
      });

      await portfolioController.getPortfolioSummary(req as any, res as any, next);

      verifyResponse(res, 200, {
        summary: {
          totalValue: 10000,
          totalGainLoss: 1000,
          totalGainLossPercentage: 10,
          numberOfHoldings: 5,
          topPerformers: [
            { id: '1', name: 'AAPL', gainLoss: 500, gainLossPercentage: 15 },
            { id: '2', name: 'MSFT', gainLoss: 300, gainLossPercentage: 12 }
          ]
        }
      });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioSummary as sinon.SinonStub).resolves(null);

      await portfolioController.getPortfolioSummary(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioPerformance', () => {
    it('should return portfolio performance if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioPerformance as sinon.SinonStub).resolves({
        daily: [{ date: new Date(), value: 10000 }],
        weekly: [{ date: new Date(), value: 9500 }],
        monthly: [{ date: new Date(), value: 9000 }]
      });

      await portfolioController.getPortfolioPerformance(req as any, res as any, next);

      verifyResponse(res, 200, {
        performance: {
          daily: [{ date: dateMatcher, value: 10000 }],
          weekly: [{ date: dateMatcher, value: 9500 }],
          monthly: [{ date: dateMatcher, value: 9000 }]
        }
      });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioPerformance as sinon.SinonStub).resolves(null);

      await portfolioController.getPortfolioPerformance(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioHoldings', () => {
    it('should return portfolio holdings if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioHoldings as sinon.SinonStub).resolves([{
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate: new Date(),
        endDate: null
      }]);

      await portfolioController.getPortfolioHoldings(req as any, res as any, next);

      verifyResponse(res, 200, {
        holdings: [{
          id: '1',
          portfolioId: '1',
          isin: 'US0378331005',
          quantity: 10,
          startDate: dateMatcher,
          endDate: null
        }]
      });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioHoldings as sinon.SinonStub).resolves(null);

      await portfolioController.getPortfolioHoldings(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioAllocation', () => {
    it('should return portfolio allocation if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioAllocation as sinon.SinonStub).resolves({
        bySector: [
          { sector: 'Technology', percentage: 60 },
          { sector: 'Healthcare', percentage: 40 }
        ],
        byAssetType: [
          { type: 'Stocks', percentage: 100 }
        ]
      });

      await portfolioController.getPortfolioAllocation(req as any, res as any, next);

      verifyResponse(res, 200, {
        allocation: {
          bySector: [
            { sector: 'Technology', percentage: 60 },
            { sector: 'Healthcare', percentage: 40 }
          ],
          byAssetType: [
            { type: 'Stocks', percentage: 100 }
          ]
        }
      });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioAllocation as sinon.SinonStub).resolves(null);

      await portfolioController.getPortfolioAllocation(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioReturns', () => {
    it('should return portfolio returns if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioReturns as sinon.SinonStub).resolves({
        totalReturn: 1000,
        totalReturnPercentage: 10,
        annualizedReturn: 12,
        periodReturns: {
          '1d': 0.5,
          '1w': 1.2,
          '1m': 2.5,
          '3m': 5.0,
          '6m': 8.0,
          '1y': 12.0,
          ytd: 7.5
        }
      });

      await portfolioController.getPortfolioReturns(req as any, res as any, next);

      verifyResponse(res, 200, {
        returns: {
          totalReturn: 1000,
          totalReturnPercentage: 10,
          annualizedReturn: 12,
          periodReturns: {
            '1d': 0.5,
            '1w': 1.2,
            '1m': 2.5,
            '3m': 5.0,
            '6m': 8.0,
            '1y': 12.0,
            ytd: 7.5
          }
        }
      });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioReturns as sinon.SinonStub).resolves(null);

      await portfolioController.getPortfolioReturns(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioHistory', () => {
    it('should return portfolio history if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioHistory as sinon.SinonStub).resolves({
        transactions: [{
          id: '1',
          holdingId: '1',
          amount: 10,
          price: 150.50,
          buy: true,
          commission: 9.99,
          broker: 'Test Broker',
          transactionTime: new Date()
        }],
        valueHistory: [{
          date: new Date(),
          value: 10000
        }]
      });

      await portfolioController.getPortfolioHistory(req as any, res as any, next);

      verifyResponse(res, 200, {
        history: {
          transactions: [{
            id: '1',
            holdingId: '1',
            amount: 10,
            price: 150.50,
            buy: true,
            commission: 9.99,
            broker: 'Test Broker',
            transactionTime: dateMatcher
          }],
          valueHistory: [{
            date: dateMatcher,
            value: 10000
          }]
        }
      });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioHistory as sinon.SinonStub).resolves(null);

      await portfolioController.getPortfolioHistory(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });
});
