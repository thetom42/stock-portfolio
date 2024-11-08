import { Portfolio, CreatePortfolioDTO, UpdatePortfolioDTO, PortfolioSummary, PortfolioDetails, PortfolioHolding } from '../models/Portfolio';
import { getPortfolioRepository, getHoldingRepository, getStockRepository, getTransactionRepository } from '../utils/database';
import * as quoteService from './quoteService';

// Helper function to map DB Portfolio to BFF Portfolio
const mapDBPortfolioToBFF = (dbPortfolio: any): Portfolio => ({
  id: dbPortfolio.PORTFOLIOS_ID,
  userId: dbPortfolio.USERS_ID,
  name: dbPortfolio.NAME,
  createdAt: dbPortfolio.CREATED_AT,
  updatedAt: dbPortfolio.CREATED_AT // DB doesn't have updated_at, using created_at
});

// Helper function to calculate average cost from transactions
const calculateAverageCost = async (holdingId: string): Promise<number> => {
  const transactionRepo = getTransactionRepository();
  const transactions = await transactionRepo.findByHolding(holdingId);
  
  let totalCost = 0;
  let totalQuantity = 0;
  
  for (const t of transactions) {
    if (t.BUY) {
      totalCost += Number(t.PRICE) * t.AMOUNT;
      totalQuantity += t.AMOUNT;
    }
  }

  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
};

export const createPortfolio = async (
  userId: string,
  portfolioData: CreatePortfolioDTO
): Promise<Portfolio> => {
  const portfolioRepo = getPortfolioRepository();
  
  const dbPortfolio = await portfolioRepo.create({
    PORTFOLIOS_ID: '', // Will be generated
    USERS_ID: userId,
    NAME: portfolioData.name,
    CREATED_AT: new Date()
  });

  return mapDBPortfolioToBFF(dbPortfolio);
};

export const getPortfoliosByUserId = async (userId: string): Promise<Portfolio[]> => {
  const portfolioRepo = getPortfolioRepository();
  const portfolios = await portfolioRepo.findByUserId(userId);
  return portfolios.map(mapDBPortfolioToBFF);
};

export const getPortfolioById = async (
  portfolioId: string,
  userId: string
): Promise<PortfolioDetails | null> => {
  const portfolioRepo = getPortfolioRepository();
  const portfolio = await portfolioRepo.findById(portfolioId);

  if (!portfolio || portfolio.USERS_ID !== userId) {
    return null;
  }

  // Get holdings for this portfolio
  const holdingRepo = getHoldingRepository();
  const holdings = await holdingRepo.findByPortfolio(portfolioId);

  // Calculate portfolio values
  let totalValue = 0;
  let totalCost = 0;
  const portfolioHoldings: PortfolioHolding[] = [];

  for (const holding of holdings) {
    const quote = await quoteService.getRealTimeQuote(holding.ISIN);
    const averageCost = await calculateAverageCost(holding.HOLDINGS_ID);
    const currentValue = quote.price * holding.QUANTITY;
    const costBasis = holding.QUANTITY * averageCost;
    const gainLoss = currentValue - costBasis;
    const gainLossPercentage = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;

    totalValue += currentValue;
    totalCost += costBasis;

    portfolioHoldings.push({
      id: holding.HOLDINGS_ID,
      stockId: holding.ISIN,
      quantity: holding.QUANTITY,
      averageCost,
      currentValue,
      gainLoss,
      gainLossPercentage
    });
  }

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return {
    ...mapDBPortfolioToBFF(portfolio),
    totalValue,
    totalGainLoss,
    totalGainLossPercentage,
    holdings: portfolioHoldings
  };
};

export const updatePortfolio = async (
  portfolioId: string,
  userId: string,
  updateData: UpdatePortfolioDTO
): Promise<Portfolio | null> => {
  const portfolioRepo = getPortfolioRepository();
  
  // Verify ownership
  const portfolio = await portfolioRepo.findById(portfolioId);
  if (!portfolio || portfolio.USERS_ID !== userId) {
    return null;
  }

  const updatedPortfolio = await portfolioRepo.update(portfolioId, {
    NAME: updateData.name || portfolio.NAME
  });

  return mapDBPortfolioToBFF(updatedPortfolio);
};

export const deletePortfolio = async (
  portfolioId: string,
  userId: string
): Promise<void> => {
  const portfolioRepo = getPortfolioRepository();
  
  // Verify ownership
  const portfolio = await portfolioRepo.findById(portfolioId);
  if (!portfolio || portfolio.USERS_ID !== userId) {
    throw new Error('Portfolio not found or unauthorized');
  }

  await portfolioRepo.delete(portfolioId);
};

export const getPortfolioSummary = async (
  portfolioId: string,
  userId: string
): Promise<PortfolioSummary | null> => {
  const portfolioRepo = getPortfolioRepository();
  const portfolio = await portfolioRepo.findById(portfolioId);

  if (!portfolio || portfolio.USERS_ID !== userId) {
    return null;
  }

  // Get holdings for this portfolio
  const holdingRepo = getHoldingRepository();
  const holdings = await holdingRepo.findByPortfolio(portfolioId);

  // Calculate summary values
  let totalValue = 0;
  let totalCost = 0;

  for (const holding of holdings) {
    const quote = await quoteService.getRealTimeQuote(holding.ISIN);
    const averageCost = await calculateAverageCost(holding.HOLDINGS_ID);
    totalValue += quote.price * holding.QUANTITY;
    totalCost += holding.QUANTITY * averageCost;
  }

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  return {
    id: portfolio.PORTFOLIOS_ID,
    name: portfolio.NAME,
    totalValue,
    totalGainLoss,
    totalGainLossPercentage,
    holdingsCount: holdings.length
  };
};
