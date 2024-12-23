import { prisma, PortfolioRepository } from '@stock-portfolio/db';
import type { Portfolio as DBPortfolio } from '@stock-portfolio/db/dist/models/Portfolio';
import type { Portfolio, CreatePortfolioDTO, UpdatePortfolioDTO, PortfolioSummary, PerformanceData, AllocationData, ReturnsData, HistoryData } from '../models/Portfolio';

// Helper function to map DB Portfolio to BFF Portfolio
const mapDBPortfolioToBFF = (dbPortfolio: DBPortfolio): Portfolio => ({
  id: dbPortfolio.portfolio_id,
  userId: dbPortfolio.user_id,
  name: dbPortfolio.name,
  createdAt: dbPortfolio.created_at,
  updatedAt: dbPortfolio.created_at, // Using created_at as we don't have updated_at in DB
});

export class PortfolioService {
  private portfolioRepository: PortfolioRepository;

  constructor(portfolioRepo?: PortfolioRepository) {
    this.portfolioRepository = portfolioRepo || new PortfolioRepository(prisma);
  }

  async getPortfolioById(portfolioId: string): Promise<Portfolio | null> {
    const portfolio = await this.portfolioRepository.findById(portfolioId);
    return portfolio ? mapDBPortfolioToBFF(portfolio) : null;
  }

  async getPortfoliosByUserId(userId: string): Promise<Portfolio[]> {
    const portfolios = await this.portfolioRepository.findByUserId(userId);
    return portfolios.map(mapDBPortfolioToBFF);
  }

  async createPortfolio(userId: string, portfolio: CreatePortfolioDTO): Promise<Portfolio> {
    const dbPortfolio = await this.portfolioRepository.create({
      portfolio_id: crypto.randomUUID(),
      user_id: userId,
      name: portfolio.name,
      created_at: new Date()
    });
    return mapDBPortfolioToBFF(dbPortfolio);
  }

  async updatePortfolio(portfolioId: string, portfolio: UpdatePortfolioDTO): Promise<Portfolio> {
    const dbPortfolio = await this.portfolioRepository.update(portfolioId, {
      name: portfolio.name
    });
    return mapDBPortfolioToBFF(dbPortfolio);
  }

  async deletePortfolio(portfolioId: string): Promise<Portfolio> {
    const dbPortfolio = await this.portfolioRepository.delete(portfolioId);
    return mapDBPortfolioToBFF(dbPortfolio);
  }

  // Additional portfolio functionality
  async getPortfolioSummary(portfolioId: string): Promise<PortfolioSummary | null> {
    const portfolio = await this.portfolioRepository.findById(portfolioId);
    if (!portfolio) return null;

    // Implementation would calculate these values
    return {
      totalValue: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      numberOfHoldings: 0,
      topPerformers: []
    };
  }

  async getPortfolioPerformance(portfolioId: string): Promise<PerformanceData | null> {
    const portfolio = await this.portfolioRepository.findById(portfolioId);
    if (!portfolio) return null;

    // Implementation would calculate performance data
    return {
      daily: [],
      weekly: [],
      monthly: []
    };
  }

  async getPortfolioHoldings(portfolioId: string): Promise<any[] | null> {
    const portfolio = await this.portfolioRepository.findById(portfolioId);
    if (!portfolio) return null;

    // Implementation would fetch and return holdings
    return [];
  }

  async getPortfolioAllocation(portfolioId: string): Promise<AllocationData | null> {
    const portfolio = await this.portfolioRepository.findById(portfolioId);
    if (!portfolio) return null;

    // Implementation would calculate allocation data
    return {
      bySector: [],
      byAssetType: []
    };
  }

  async getPortfolioReturns(portfolioId: string): Promise<ReturnsData | null> {
    const portfolio = await this.portfolioRepository.findById(portfolioId);
    if (!portfolio) return null;

    // Implementation would calculate returns data
    return {
      totalReturn: 0,
      totalReturnPercentage: 0,
      annualizedReturn: 0,
      periodReturns: {
        '1d': 0,
        '1w': 0,
        '1m': 0,
        '3m': 0,
        '6m': 0,
        '1y': 0,
        ytd: 0
      }
    };
  }

  async getPortfolioHistory(portfolioId: string): Promise<HistoryData | null> {
    const portfolio = await this.portfolioRepository.findById(portfolioId);
    if (!portfolio) return null;

    // Implementation would fetch historical data
    return {
      transactions: [],
      valueHistory: []
    };
  }
}

// Export a singleton instance
export const portfolioService = new PortfolioService();

// For testing: allow repository injection
export const setPortfolioRepository = (repo: PortfolioRepository) => {
  return new PortfolioService(repo);
};
