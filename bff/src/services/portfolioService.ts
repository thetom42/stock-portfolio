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
