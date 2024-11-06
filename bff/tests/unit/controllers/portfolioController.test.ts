import { expect, use } from 'chai';
import spies from 'chai-spies';
import { Request, Response } from 'express';
import * as portfolioService from '../../../src/services/portfolioService';
import * as portfolioController from '../../../src/controllers/portfolioController';
import { Portfolio, CreatePortfolioDTO, UpdatePortfolioDTO, PortfolioSummary } from '../../../src/models/Portfolio';

use(spies);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('PortfolioController', () => {
  let req: Partial<Request>;
  let res: MockResponse;
  let next: any;

  const userId = 'user123';

  beforeEach(() => {
    res = {
      status: chai.spy(function(this: MockResponse, code: number) { return this; }),
      json: chai.spy(),
      send: chai.spy()
    };
    next = chai.spy();
  });

  afterEach(() => {
    chai.spy.restore();
  });

  describe('createPortfolio', () => {
    const mockPortfolioData: CreatePortfolioDTO = {
      name: 'Test Portfolio',
      description: 'Test Description'
    };

    const mockCreatedPortfolio: Portfolio = {
      id: 'portfolio123',
      userId,
      name: mockPortfolioData.name,
      description: mockPortfolioData.description,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a portfolio and return 201 status', async () => {
      req = {
        user: { id: userId },
        body: mockPortfolioData
      } as any;

      chai.spy.on(portfolioService, 'createPortfolio', () => Promise.resolve(mockCreatedPortfolio));

      await portfolioController.createPortfolio(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(201);
      expect(res.json).to.have.been.called.with(mockCreatedPortfolio);
    });

    it('should call next with error if portfolio creation fails', async () => {
      req = {
        user: { id: userId },
        body: mockPortfolioData
      } as any;

      const error = new Error('Creation failed');
      chai.spy.on(portfolioService, 'createPortfolio', () => Promise.reject(error));

      await portfolioController.createPortfolio(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });

  describe('getUserPortfolios', () => {
    const mockPortfolios: Portfolio[] = [
      {
        id: 'portfolio123',
        userId,
        name: 'Portfolio 1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should return user portfolios', async () => {
      req = {
        user: { id: userId }
      } as any;

      chai.spy.on(portfolioService, 'getPortfoliosByUserId', () => Promise.resolve(mockPortfolios));

      await portfolioController.getUserPortfolios(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockPortfolios);
    });
  });

  describe('getPortfolio', () => {
    const mockPortfolio: Portfolio = {
      id: 'portfolio123',
      userId,
      name: 'Test Portfolio',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return portfolio if found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'portfolio123' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioById', () => Promise.resolve(mockPortfolio));

      await portfolioController.getPortfolio(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockPortfolio);
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioById', () => Promise.resolve(null));

      await portfolioController.getPortfolio(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Portfolio not found' });
    });
  });

  describe('updatePortfolio', () => {
    const mockUpdateData: UpdatePortfolioDTO = {
      name: 'Updated Portfolio'
    };

    const mockUpdatedPortfolio: Portfolio = {
      id: 'portfolio123',
      userId,
      name: 'Updated Portfolio',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update portfolio successfully', async () => {
      req = {
        user: { id: userId },
        params: { id: 'portfolio123' },
        body: mockUpdateData
      } as any;

      chai.spy.on(portfolioService, 'updatePortfolio', () => Promise.resolve(mockUpdatedPortfolio));

      await portfolioController.updatePortfolio(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockUpdatedPortfolio);
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' },
        body: mockUpdateData
      } as any;

      chai.spy.on(portfolioService, 'updatePortfolio', () => Promise.resolve(null));

      await portfolioController.updatePortfolio(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Portfolio not found' });
    });
  });

  describe('getPortfolioSummary', () => {
    const mockSummary: PortfolioSummary = {
      id: 'portfolio123',
      name: 'Test Portfolio',
      totalValue: 10000,
      totalGainLoss: 1000,
      totalGainLossPercentage: 10,
      holdingsCount: 5
    };

    it('should return portfolio summary', async () => {
      req = {
        user: { id: userId },
        params: { id: 'portfolio123' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioSummary', () => Promise.resolve(mockSummary));

      await portfolioController.getPortfolioSummary(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockSummary);
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioSummary', () => Promise.resolve(null));

      await portfolioController.getPortfolioSummary(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Portfolio not found' });
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio and return 204 status', async () => {
      req = {
        user: { id: userId },
        params: { id: 'portfolio123' }
      } as any;

      chai.spy.on(portfolioService, 'deletePortfolio', () => Promise.resolve());

      await portfolioController.deletePortfolio(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(204);
      expect(res.send).to.have.been.called();
    });

    it('should call next with error if deletion fails', async () => {
      req = {
        user: { id: userId },
        params: { id: 'portfolio123' }
      } as any;

      const error = new Error('Deletion failed');
      chai.spy.on(portfolioService, 'deletePortfolio', () => Promise.reject(error));

      await portfolioController.deletePortfolio(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });
});
