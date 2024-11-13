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
});
