import { CreatePortfolioDTO, UpdatePortfolioDTO, PortfolioDetails, PortfolioHolding } from '../models/Portfolio';
import { PortfolioRepository } from '../../../db/repositories/PortfolioRepository';
import { getPrismaClient } from '../utils/database';
import * as holdingService from './holdingService';

// Helper function to map DB Portfolio to API response
const mapDBPortfolioToDetails = async (dbPortfolio: any): Promise<PortfolioDetails> => {
  // Get holdings for this portfolio
  const holdings = await holdingService.getHoldingsByPortfolioId(dbPortfolio.PORTFOLIOS_ID);
  
  // Calculate portfolio totals
  let totalValue = 0;
  let totalCost = 0;

  const portfolioHoldings: PortfolioHolding[] = holdings.map(holding => {
    const currentValue = holding.currentPrice * holding.QUANTITY;
    totalValue += currentValue;
    // Note: This is a simplified cost calculation. In reality, we'd need to consider all transactions
    const cost = holding.currentPrice * holding.QUANTITY; // Placeholder
    totalCost += cost;

    return {
      id: holding.HOLDINGS_ID,
      stockId: holding.ISIN,
      quantity: holding.QUANTITY,
      averageCost: cost / holding.QUANTITY,
      currentValue,
      gainLoss: currentValue - cost,
      gainLossPercentage: ((currentValue - cost) / cost) * 100
    };
  });

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return {
    id: dbPortfolio.PORTFOLIOS_ID,
    userId: dbPortfolio.USERS_ID,
    name: dbPortfolio.NAME,
    description: '', // Not stored in DB
    createdAt: dbPortfolio.CREATED_AT,
    updatedAt: dbPortfolio.CREATED_AT, // Using CREATED_AT as we don't have UPDATED_AT
    totalValue,
    totalGainLoss,
    totalGainLossPercentage,
    holdings: portfolioHoldings
  };
};

// Initialize repository
let portfolioRepository = new PortfolioRepository(getPrismaClient());

// For testing: allow repository injection
export const setPortfolioRepository = (repo: any) => {
  portfolioRepository = repo;
};

export const createPortfolio = async (
  userId: string,
  portfolioData: CreatePortfolioDTO
): Promise<PortfolioDetails> => {
  try {
    const dbPortfolio = await portfolioRepository.create({
      PORTFOLIOS_ID: '', // Will be generated
      USERS_ID: userId,
      NAME: portfolioData.name,
      CREATED_AT: new Date()
    });

    return await mapDBPortfolioToDetails(dbPortfolio);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create portfolio');
  }
};

export const getPortfolioById = async (
  portfolioId: string
): Promise<PortfolioDetails | null> => {
  const portfolio = await portfolioRepository.findById(portfolioId);

  if (!portfolio) {
    return null;
  }

  return await mapDBPortfolioToDetails(portfolio);
};

export const getPortfoliosByUserId = async (
  userId: string
): Promise<PortfolioDetails[]> => {
  const portfolios = await portfolioRepository.findByUserId(userId);
  return Promise.all(portfolios.map(mapDBPortfolioToDetails));
};

export const updatePortfolio = async (
  portfolioId: string,
  updateData: UpdatePortfolioDTO
): Promise<PortfolioDetails | null> => {
  try {
    // First check if portfolio exists
    const existingPortfolio = await portfolioRepository.findById(portfolioId);

    if (!existingPortfolio) {
      return null;
    }

    const updatedPortfolio = await portfolioRepository.update(portfolioId, {
      NAME: updateData.name
    });

    return await mapDBPortfolioToDetails(updatedPortfolio);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update portfolio');
  }
};

export const deletePortfolio = async (portfolioId: string): Promise<void> => {
  try {
    await portfolioRepository.delete(portfolioId);
  } catch (error) {
    if (error instanceof Error && error.message === 'Portfolio not found') {
      throw error;
    }
    throw new Error('Failed to delete portfolio');
  }
};

export const getPortfolioSummary = async (portfolioId: string) => {
  const portfolio = await getPortfolioById(portfolioId);
  if (!portfolio) return null;

  const holdings = portfolio.holdings;
  const topPerformers = [...holdings]
    .sort((a, b) => b.gainLossPercentage - a.gainLossPercentage)
    .slice(0, 5)
    .map(h => ({
      symbol: h.stockId,
      gainLossPercentage: h.gainLossPercentage
    }));

  return {
    totalValue: portfolio.totalValue || 0,
    totalGainLoss: portfolio.totalGainLoss || 0,
    totalGainLossPercentage: portfolio.totalGainLossPercentage || 0,
    numberOfHoldings: holdings.length,
    topPerformers
  };
};

export const getPortfolioPerformance = async (portfolioId: string) => {
  const portfolio = await getPortfolioById(portfolioId);
  if (!portfolio) return null;

  const baseValue = portfolio.totalValue || 0;

  // Mock data for demonstration - in real implementation, this would come from historical data
  const today = new Date();
  const dailyData = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(today.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: baseValue * (1 + (Math.random() * 0.1 - 0.05))
  })).reverse();

  const weeklyData = Array.from({ length: 4 }, (_, i) => ({
    date: `2023-W${i + 1}`,
    value: baseValue * (1 + (Math.random() * 0.2 - 0.1))
  }));

  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    date: `2023-${String(i + 1).padStart(2, '0')}`,
    value: baseValue * (1 + (Math.random() * 0.3 - 0.15))
  }));

  return {
    daily: dailyData,
    weekly: weeklyData,
    monthly: monthlyData
  };
};

export const getPortfolioHoldings = async (portfolioId: string) => {
  const portfolio = await getPortfolioById(portfolioId);
  if (!portfolio) return null;

  return portfolio.holdings;
};

export const getPortfolioAllocation = async (portfolioId: string) => {
  const portfolio = await getPortfolioById(portfolioId);
  if (!portfolio) return null;

  // Mock data for demonstration - in real implementation, this would come from stock metadata
  const sectors = ['Technology', 'Healthcare', 'Finance', 'Consumer Goods', 'Energy'];
  const assetTypes = ['Stocks', 'ETFs', 'Bonds', 'Cash'];

  const bySector = sectors.map(sector => ({
    sector,
    percentage: Math.random() * 100
  }));

  const byAssetType = assetTypes.map(type => ({
    type,
    percentage: Math.random() * 100
  }));

  // Normalize percentages to sum to 100
  const normalizePercentages = (items: Array<{ percentage: number }>) => {
    const total = items.reduce((sum, item) => sum + item.percentage, 0);
    items.forEach(item => {
      item.percentage = (item.percentage / total) * 100;
    });
  };

  normalizePercentages(bySector);
  normalizePercentages(byAssetType);

  return {
    bySector,
    byAssetType
  };
};

export const getPortfolioReturns = async (portfolioId: string) => {
  const portfolio = await getPortfolioById(portfolioId);
  if (!portfolio) return null;

  const totalGainLossPercentage = portfolio.totalGainLossPercentage || 0;

  // Mock data for demonstration - in real implementation, this would be calculated from historical data
  return {
    totalReturn: portfolio.totalGainLoss || 0,
    totalReturnPercentage: totalGainLossPercentage,
    annualizedReturn: totalGainLossPercentage / 2, // Simplified calculation
    periodReturns: {
      '1d': Math.random() * 2 - 1,
      '1w': Math.random() * 5 - 2.5,
      '1m': Math.random() * 10 - 5,
      '3m': Math.random() * 15 - 7.5,
      '6m': Math.random() * 20 - 10,
      '1y': Math.random() * 30 - 15,
      'ytd': Math.random() * 25 - 12.5
    }
  };
};

export const getPortfolioHistory = async (portfolioId: string) => {
  const portfolio = await getPortfolioById(portfolioId);
  if (!portfolio) return null;

  const baseValue = portfolio.totalValue || 0;

  // Mock data for demonstration - in real implementation, this would come from transaction history
  const transactions = Array.from({ length: 10 }, (_, i) => ({
    date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    type: Math.random() > 0.5 ? 'BUY' : 'SELL',
    symbol: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'][Math.floor(Math.random() * 4)],
    quantity: Math.floor(Math.random() * 100) + 1,
    price: Math.random() * 1000
  }));

  const valueHistory = Array.from({ length: 12 }, (_, i) => ({
    date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: baseValue * (1 + (Math.random() * 0.4 - 0.2))
  }));

  return {
    transactions,
    valueHistory
  };
};
