import { expect } from 'chai';
import sinon from 'sinon';
import * as portfolioService from '../../../src/services/portfolioService';
import * as portfolioController from '../../../src/controllers/portfolioController';
import { CreatePortfolioDTO, PortfolioDetails } from '../../../src/models/Portfolio';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
import { setupRepositoryMocks, resetRepositoryMocks, mockPortfolioRepo } from '../../helpers/mockRepositories';

describe('PortfolioController', () => {
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

  describe('createPortfolio', () => {
    const mockCreateData: CreatePortfolioDTO = {
      name: 'Test Portfolio',
      description: 'Test portfolio description'
    };

    const mockCreatedPortfolio: PortfolioDetails = {
      id: '1',
      userId: 'user1',
      name: mockCreateData.name,
      description: mockCreateData.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      holdings: [],
      totalValue: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0
    };

    it('should create a portfolio and return 201 status', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'createPortfolio').resolves(mockCreatedPortfolio);

      await portfolioController.createPortfolio(req as any, res as any, next);

      verifyResponse(res, 201, { portfolio: mockCreatedPortfolio });
    });

    it('should call next with error if creation fails', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      const error = new Error('Database error');
      sinon.stub(portfolioService, 'createPortfolio').rejects(error);

      await portfolioController.createPortfolio(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getPortfolio', () => {
    const mockPortfolioDetails: PortfolioDetails = {
      id: '1',
      userId: 'user1',
      name: 'Test Portfolio',
      description: 'Test portfolio description',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalValue: 10000,
      totalGainLoss: 500,
      totalGainLossPercentage: 5,
      holdings: [
        {
          id: '1',
          stockId: 'stock1',
          quantity: 10,
          averageCost: 100,
          currentValue: 1500,
          gainLoss: 500,
          gainLossPercentage: 50
        }
      ]
    };

    it('should return portfolio if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioById').resolves(mockPortfolioDetails);

      await portfolioController.getPortfolio(req as any, res as any, next);

      verifyResponse(res, 200, { portfolio: mockPortfolioDetails });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioById').resolves(null);

      await portfolioController.getPortfolio(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('updatePortfolio', () => {
    const mockUpdateData = {
      name: 'Updated Portfolio',
      description: 'Updated description'
    };

    const mockUpdatedPortfolio: PortfolioDetails = {
      id: '1',
      userId: 'user1',
      name: mockUpdateData.name,
      description: mockUpdateData.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      holdings: [],
      totalValue: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0
    };

    it('should update portfolio and return updated data', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'updatePortfolio').resolves(mockUpdatedPortfolio);

      await portfolioController.updatePortfolio(req as any, res as any, next);

      verifyResponse(res, 200, { portfolio: mockUpdatedPortfolio });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'updatePortfolio').resolves(null);

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

      sinon.stub(portfolioService, 'deletePortfolio').resolves();

      await portfolioController.deletePortfolio(req as any, res as any, next);

      verifyResponse(res, 204);
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      const error = new Error('Portfolio not found');
      sinon.stub(portfolioService, 'deletePortfolio').rejects(error);

      await portfolioController.deletePortfolio(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioSummary', () => {
    const mockSummary = {
      totalValue: 10000,
      totalGainLoss: 500,
      totalGainLossPercentage: 5,
      numberOfHoldings: 3,
      topPerformers: [
        { symbol: 'AAPL', gainLossPercentage: 15 },
        { symbol: 'MSFT', gainLossPercentage: 10 }
      ]
    };

    it('should return portfolio summary if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioSummary').resolves(mockSummary);

      await portfolioController.getPortfolioSummary(req as any, res as any, next);

      verifyResponse(res, 200, { summary: mockSummary });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioSummary').resolves(null);

      await portfolioController.getPortfolioSummary(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioPerformance', () => {
    const mockPerformance = {
      daily: [
        { date: '2023-01-01', value: 10000 },
        { date: '2023-01-02', value: 10500 }
      ],
      weekly: [
        { date: '2023-W1', value: 10000 },
        { date: '2023-W2', value: 11000 }
      ],
      monthly: [
        { date: '2023-01', value: 10000 },
        { date: '2023-02', value: 12000 }
      ]
    };

    it('should return portfolio performance if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioPerformance').resolves(mockPerformance);

      await portfolioController.getPortfolioPerformance(req as any, res as any, next);

      verifyResponse(res, 200, { performance: mockPerformance });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioPerformance').resolves(null);

      await portfolioController.getPortfolioPerformance(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioHoldings', () => {
    const mockHoldings = [
      {
        id: '1',
        stockId: 'AAPL',
        quantity: 10,
        averageCost: 150,
        currentValue: 1600,
        gainLoss: 100,
        gainLossPercentage: 6.67
      },
      {
        id: '2',
        stockId: 'MSFT',
        quantity: 5,
        averageCost: 200,
        currentValue: 1100,
        gainLoss: 100,
        gainLossPercentage: 10
      }
    ];

    it('should return portfolio holdings if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioHoldings').resolves(mockHoldings);

      await portfolioController.getPortfolioHoldings(req as any, res as any, next);

      verifyResponse(res, 200, { holdings: mockHoldings });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioHoldings').resolves(null);

      await portfolioController.getPortfolioHoldings(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioAllocation', () => {
    const mockAllocation = {
      bySector: [
        { sector: 'Technology', percentage: 45 },
        { sector: 'Healthcare', percentage: 30 },
        { sector: 'Finance', percentage: 25 }
      ],
      byAssetType: [
        { type: 'Stocks', percentage: 80 },
        { type: 'ETFs', percentage: 20 }
      ]
    };

    it('should return portfolio allocation if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioAllocation').resolves(mockAllocation);

      await portfolioController.getPortfolioAllocation(req as any, res as any, next);

      verifyResponse(res, 200, { allocation: mockAllocation });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioAllocation').resolves(null);

      await portfolioController.getPortfolioAllocation(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioReturns', () => {
    const mockReturns = {
      totalReturn: 1500,
      totalReturnPercentage: 15,
      annualizedReturn: 12,
      periodReturns: {
        '1d': 0.5,
        '1w': 2.5,
        '1m': 5,
        '3m': 8,
        '6m': 10,
        '1y': 15,
        'ytd': 12
      }
    };

    it('should return portfolio returns if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioReturns').resolves(mockReturns);

      await portfolioController.getPortfolioReturns(req as any, res as any, next);

      verifyResponse(res, 200, { returns: mockReturns });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioReturns').resolves(null);

      await portfolioController.getPortfolioReturns(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });

  describe('getPortfolioHistory', () => {
    const mockHistory = {
      transactions: [
        {
          date: '2023-01-01',
          type: 'BUY',
          symbol: 'AAPL',
          quantity: 10,
          price: 150
        },
        {
          date: '2023-02-01',
          type: 'SELL',
          symbol: 'MSFT',
          quantity: 5,
          price: 200
        }
      ],
      valueHistory: [
        { date: '2023-01-01', value: 10000 },
        { date: '2023-02-01', value: 11000 }
      ]
    };

    it('should return portfolio history if found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioHistory').resolves(mockHistory);

      await portfolioController.getPortfolioHistory(req as any, res as any, next);

      verifyResponse(res, 200, { history: mockHistory });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        user: { id: 'user1' }
      });

      sinon.stub(portfolioService, 'getPortfolioHistory').resolves(null);

      await portfolioController.getPortfolioHistory(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });
  });
});
