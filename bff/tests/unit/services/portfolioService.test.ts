import 'mocha';
import { expect } from 'chai';
import { mockQueryResult, mockQuery, mockTransaction, resetMocks } from '../../helpers/mockDb';
import * as portfolioService from '../../../src/services/portfolioService';
import { CreatePortfolioDTO, UpdatePortfolioDTO, Portfolio, PortfolioSummary } from '../../../src/models/Portfolio';

describe('PortfolioService', () => {
  beforeEach(() => {
    resetMocks();
  });

  const userId = 'user123';

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
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should create a portfolio successfully', async () => {
      mockQuery.resolves(mockQueryResult([mockCreatedPortfolio]));

      const result = await portfolioService.createPortfolio(userId, mockPortfolioData);

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('INSERT INTO portfolios');
      expect(mockQuery.firstCall.args[1]).to.deep.equal([
        userId,
        mockPortfolioData.name,
        mockPortfolioData.description
      ]);
      expect(result).to.deep.equal(mockCreatedPortfolio);
    });
  });

  describe('getPortfoliosByUserId', () => {
    const mockPortfolios: Portfolio[] = [
      {
        id: 'portfolio123',
        userId,
        name: 'Portfolio 1',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    it('should return user portfolios', async () => {
      mockQuery.resolves(mockQueryResult(mockPortfolios));

      const result = await portfolioService.getPortfoliosByUserId(userId);

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('SELECT');
      expect(mockQuery.firstCall.args[1]).to.deep.equal([userId]);
      expect(result).to.deep.equal(mockPortfolios);
    });
  });

  describe('getPortfolioById', () => {
    const mockPortfolio = {
      id: 'portfolio123',
      userId,
      name: 'Test Portfolio',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      totalValue: 10000,
      totalGainLoss: 1000,
      totalGainLossPercentage: 10
    };

    it('should return portfolio with details if found', async () => {
      mockQuery.resolves(mockQueryResult([mockPortfolio]));

      const result = await portfolioService.getPortfolioById('portfolio123', userId);

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('SELECT');
      expect(mockQuery.firstCall.args[1]).to.deep.equal(['portfolio123', userId]);
      expect(result).to.deep.equal(mockPortfolio);
    });

    it('should return null if portfolio not found', async () => {
      mockQuery.resolves(mockQueryResult([]));

      const result = await portfolioService.getPortfolioById('nonexistent', userId);

      expect(mockQuery).to.have.been.called();
      expect(result).to.be.null;
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
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should update portfolio successfully', async () => {
      mockQuery.resolves(mockQueryResult([mockUpdatedPortfolio]));

      const result = await portfolioService.updatePortfolio('portfolio123', userId, mockUpdateData);

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('UPDATE portfolios');
      expect(mockQuery.firstCall.args[1]).to.deep.equal([
        mockUpdateData.name,
        'portfolio123',
        userId
      ]);
      expect(result).to.deep.equal(mockUpdatedPortfolio);
    });

    it('should return null if portfolio not found', async () => {
      mockQuery.resolves(mockQueryResult([]));

      const result = await portfolioService.updatePortfolio('nonexistent', userId, mockUpdateData);

      expect(mockQuery).to.have.been.called();
      expect(result).to.be.null;
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio and related data successfully', async () => {
      mockTransaction.resolves();

      await portfolioService.deletePortfolio('portfolio123', userId);

      expect(mockTransaction).to.have.been.called();
      const transactionCallback = mockTransaction.firstCall.args[0];
      expect(transactionCallback).to.be.a('function');
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
      mockQuery.resolves(mockQueryResult([mockSummary]));

      const result = await portfolioService.getPortfolioSummary('portfolio123', userId);

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('SELECT');
      expect(mockQuery.firstCall.args[1]).to.deep.equal(['portfolio123', userId]);
      expect(result).to.deep.equal(mockSummary);
    });

    it('should return null if portfolio not found', async () => {
      mockQuery.resolves(mockQueryResult([]));

      const result = await portfolioService.getPortfolioSummary('nonexistent', userId);

      expect(mockQuery).to.have.been.called();
      expect(result).to.be.null;
    });
  });

  describe('getPortfolioPerformance', () => {
    const mockPerformance = [
      {
        date: new Date('2024-01-01'),
        value: 10000,
        cost: 9000,
        absoluteReturn: 1000,
        percentageReturn: 11.11
      }
    ];

    it('should return portfolio performance data', async () => {
      mockQuery.resolves(mockQueryResult(mockPerformance));

      const result = await portfolioService.getPortfolioPerformance('portfolio123', userId);

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('WITH daily_values');
      expect(mockQuery.firstCall.args[1]).to.deep.equal(['portfolio123']);
      expect(result).to.deep.equal(mockPerformance);
    });
  });

  describe('getPortfolioHoldings', () => {
    const mockHoldings = [
      {
        id: 'holding123',
        stockId: 'stock123',
        symbol: 'AAPL',
        name: 'Apple Inc',
        quantity: 10,
        averageCost: 150,
        currentPrice: 170,
        currentValue: 1700,
        gainLoss: 200,
        gainLossPercentage: 13.33
      }
    ];

    it('should return portfolio holdings', async () => {
      mockQuery.resolves(mockQueryResult(mockHoldings));

      const result = await portfolioService.getPortfolioHoldings('portfolio123', userId);

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('SELECT');
      expect(mockQuery.firstCall.args[1]).to.deep.equal(['portfolio123']);
      expect(result).to.deep.equal(mockHoldings);
    });
  });

  describe('getPortfolioAllocation', () => {
    const mockAllocation = [
      {
        sector: 'Technology',
        sectorValue: 5000,
        percentage: 50
      }
    ];

    it('should return portfolio allocation by sector', async () => {
      mockQuery.resolves(mockQueryResult(mockAllocation));

      const result = await portfolioService.getPortfolioAllocation('portfolio123', userId);

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('WITH holding_values');
      expect(mockQuery.firstCall.args[1]).to.deep.equal(['portfolio123']);
      expect(result).to.deep.equal(mockAllocation);
    });
  });
});
