import { expect, use } from 'chai';
import spies from 'chai-spies';
import { Request, Response } from 'express';
import * as portfolioService from '../../../src/services/portfolioService';
import * as portfolioController from '../../../src/controllers/portfolioController';
import { 
  Portfolio, 
  CreatePortfolioDTO, 
  UpdatePortfolioDTO, 
  PortfolioSummary,
  PortfolioDetails,
  PortfolioHolding
} from '../../../src/models/Portfolio';

use(spies);

// Additional interfaces for the extended endpoints
interface PortfolioPerformance {
  totalReturn: number;
  totalReturnPercentage: number;
  periodReturns: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  benchmarkComparison?: {
    benchmarkReturn: number;
    outperformance: number;
  };
}

interface PortfolioAllocation {
  sectors: Array<{ name: string; percentage: number }>;
  assetTypes: Array<{ type: string; percentage: number }>;
  geographicRegions: Array<{ region: string; percentage: number }>;
  currencies: Array<{ currency: string; percentage: number }>;
}

interface PortfolioReturns {
  timeWeightedReturn: number;
  moneyWeightedReturn: number;
  periodReturns: Array<{
    period: string;
    return: number;
    benchmark?: number;
  }>;
}

interface PortfolioHistory {
  dataPoints: Array<{
    date: Date;
    value: number;
    cash: number;
    invested: number;
    returns: number;
  }>;
}

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

    it('should call next with error if user is not authenticated', async () => {
      req = {
        body: mockPortfolioData
      } as any;

      await portfolioController.createPortfolio(req as any, res as any, next);

      expect(next).to.have.been.called();
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

    it('should call next with error if user is not authenticated', async () => {
      req = {} as any;

      await portfolioController.getUserPortfolios(req as any, res as any, next);

      expect(next).to.have.been.called();
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

    it('should call next with error if user is not authenticated', async () => {
      req = {
        params: { id: 'portfolio123' }
      } as any;

      await portfolioController.getPortfolio(req as any, res as any, next);

      expect(next).to.have.been.called();
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

    it('should call next with error if user is not authenticated', async () => {
      req = {
        params: { id: 'portfolio123' },
        body: mockUpdateData
      } as any;

      await portfolioController.updatePortfolio(req as any, res as any, next);

      expect(next).to.have.been.called();
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

    it('should call next with error if user is not authenticated', async () => {
      req = {
        params: { id: 'portfolio123' }
      } as any;

      await portfolioController.getPortfolioSummary(req as any, res as any, next);

      expect(next).to.have.been.called();
    });
  });

  describe('getPortfolioPerformance', () => {
    const mockPerformance: PortfolioPerformance = {
      totalReturn: 1500,
      totalReturnPercentage: 15,
      periodReturns: {
        daily: 0.5,
        weekly: 2.5,
        monthly: 5,
        yearly: 15
      },
      benchmarkComparison: {
        benchmarkReturn: 12,
        outperformance: 3
      }
    };

    it('should return portfolio performance', async () => {
      req = {
        user: { id: userId },
        params: { id: 'portfolio123' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioPerformance', () => Promise.resolve(mockPerformance));

      await portfolioController.getPortfolioPerformance(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockPerformance);
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioPerformance', () => Promise.resolve(null));

      await portfolioController.getPortfolioPerformance(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Portfolio not found' });
    });

    it('should call next with error if user is not authenticated', async () => {
      req = {
        params: { id: 'portfolio123' }
      } as any;

      await portfolioController.getPortfolioPerformance(req as any, res as any, next);

      expect(next).to.have.been.called();
    });
  });

  describe('getPortfolioHoldings', () => {
    const mockHoldings: PortfolioHolding[] = [
      {
        id: 'holding1',
        stockId: 'stock1',
        quantity: 100,
        averageCost: 150,
        currentValue: 16000,
        gainLoss: 1000,
        gainLossPercentage: 6.67
      }
    ];

    it('should return portfolio holdings', async () => {
      req = {
        user: { id: userId },
        params: { id: 'portfolio123' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioHoldings', () => Promise.resolve(mockHoldings));

      await portfolioController.getPortfolioHoldings(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockHoldings);
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioHoldings', () => Promise.resolve(null));

      await portfolioController.getPortfolioHoldings(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Portfolio not found' });
    });

    it('should call next with error if user is not authenticated', async () => {
      req = {
        params: { id: 'portfolio123' }
      } as any;

      await portfolioController.getPortfolioHoldings(req as any, res as any, next);

      expect(next).to.have.been.called();
    });
  });

  describe('getPortfolioAllocation', () => {
    const mockAllocation: PortfolioAllocation = {
      sectors: [
        { name: 'Technology', percentage: 40 },
        { name: 'Healthcare', percentage: 30 },
        { name: 'Finance', percentage: 30 }
      ],
      assetTypes: [
        { type: 'Stocks', percentage: 80 },
        { type: 'Bonds', percentage: 20 }
      ],
      geographicRegions: [
        { region: 'North America', percentage: 60 },
        { region: 'Europe', percentage: 40 }
      ],
      currencies: [
        { currency: 'USD', percentage: 70 },
        { currency: 'EUR', percentage: 30 }
      ]
    };

    it('should return portfolio allocation', async () => {
      req = {
        user: { id: userId },
        params: { id: 'portfolio123' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioAllocation', () => Promise.resolve(mockAllocation));

      await portfolioController.getPortfolioAllocation(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockAllocation);
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioAllocation', () => Promise.resolve(null));

      await portfolioController.getPortfolioAllocation(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Portfolio not found' });
    });

    it('should call next with error if user is not authenticated', async () => {
      req = {
        params: { id: 'portfolio123' }
      } as any;

      await portfolioController.getPortfolioAllocation(req as any, res as any, next);

      expect(next).to.have.been.called();
    });
  });

  describe('getPortfolioReturns', () => {
    const mockReturns: PortfolioReturns = {
      timeWeightedReturn: 12.5,
      moneyWeightedReturn: 11.8,
      periodReturns: [
        { period: '1M', return: 2.5, benchmark: 2.0 },
        { period: '3M', return: 5.5, benchmark: 4.8 },
        { period: '1Y', return: 12.5, benchmark: 10.0 }
      ]
    };

    it('should return portfolio returns', async () => {
      req = {
        user: { id: userId },
        params: { id: 'portfolio123' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioReturns', () => Promise.resolve(mockReturns));

      await portfolioController.getPortfolioReturns(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockReturns);
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioReturns', () => Promise.resolve(null));

      await portfolioController.getPortfolioReturns(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Portfolio not found' });
    });

    it('should call next with error if user is not authenticated', async () => {
      req = {
        params: { id: 'portfolio123' }
      } as any;

      await portfolioController.getPortfolioReturns(req as any, res as any, next);

      expect(next).to.have.been.called();
    });
  });

  describe('getPortfolioHistory', () => {
    const mockHistory: PortfolioHistory = {
      dataPoints: [
        {
          date: new Date('2023-01-01'),
          value: 10000,
          cash: 1000,
          invested: 9000,
          returns: 0
        },
        {
          date: new Date('2023-12-31'),
          value: 11500,
          cash: 1000,
          invested: 9000,
          returns: 1500
        }
      ]
    };

    it('should return portfolio history', async () => {
      req = {
        user: { id: userId },
        params: { id: 'portfolio123' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioHistory', () => Promise.resolve(mockHistory));

      await portfolioController.getPortfolioHistory(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockHistory);
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' }
      } as any;

      chai.spy.on(portfolioService, 'getPortfolioHistory', () => Promise.resolve(null));

      await portfolioController.getPortfolioHistory(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Portfolio not found' });
    });

    it('should call next with error if user is not authenticated', async () => {
      req = {
        params: { id: 'portfolio123' }
      } as any;

      await portfolioController.getPortfolioHistory(req as any, res as any, next);

      expect(next).to.have.been.called();
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

    it('should call next with error if user is not authenticated', async () => {
      req = {
        params: { id: 'portfolio123' }
      } as any;

      await portfolioController.deletePortfolio(req as any, res as any, next);

      expect(next).to.have.been.called();
    });
  });
});
