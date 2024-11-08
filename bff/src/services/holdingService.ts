import { Holding, CreateHoldingDTO, UpdateHoldingDTO, HoldingDetails, Transaction, HoldingPerformance, HoldingValue, HoldingHistory } from '../models/Holding';
import { getHoldingRepository, getPortfolioRepository, getTransactionRepository, getStockRepository } from '../utils/database';
import * as quoteService from './quoteService';

// Helper function to map DB Transaction to BFF Transaction
const mapDBTransactionToBFF = (dbTransaction: any): Transaction => ({
  TRANSACTIONS_ID: dbTransaction.TRANSACTIONS_ID,
  HOLDINGS_ID: dbTransaction.HOLDINGS_ID,
  BUY: dbTransaction.BUY,
  TRANSACTION_TIME: dbTransaction.TRANSACTION_TIME,
  AMOUNT: dbTransaction.AMOUNT,
  PRICE: Number(dbTransaction.PRICE),
  COMMISSION: Number(dbTransaction.COMMISSION),
  BROKER: dbTransaction.BROKER
});

export const createHolding = async (
  userId: string,
  holdingData: CreateHoldingDTO
): Promise<Holding> => {
  // First verify the portfolio belongs to the user
  const portfolioRepo = getPortfolioRepository();
  const portfolio = await portfolioRepo.findById(holdingData.PORTFOLIOS_ID);
  
  if (!portfolio || portfolio.USERS_ID !== userId) {
    throw new Error('Portfolio not found or unauthorized');
  }

  // Create the holding
  const holdingRepo = getHoldingRepository();
  const holding = await holdingRepo.create({
    HOLDINGS_ID: '', // Will be generated by the repository
    PORTFOLIOS_ID: holdingData.PORTFOLIOS_ID,
    ISIN: holdingData.ISIN,
    QUANTITY: holdingData.QUANTITY,
    START_DATE: new Date(),
    END_DATE: null
  });

  // Record the initial transaction
  const transactionRepo = getTransactionRepository();
  await transactionRepo.create({
    TRANSACTIONS_ID: '', // Will be generated by the repository
    HOLDINGS_ID: holding.HOLDINGS_ID,
    BUY: true,
    TRANSACTION_TIME: new Date(),
    AMOUNT: holdingData.QUANTITY,
    PRICE: holdingData.PRICE,
    COMMISSION: 0,
    BROKER: 'SYSTEM'
  });

  return holding;
};

export const getHoldingById = async (
  holdingId: string,
  userId: string
): Promise<HoldingDetails | null> => {
  const holdingRepo = getHoldingRepository();
  const holding = await holdingRepo.findById(holdingId);
  
  if (!holding) {
    return null;
  }

  // Verify ownership through portfolio
  const portfolioRepo = getPortfolioRepository();
  const portfolio = await portfolioRepo.findById(holding.PORTFOLIOS_ID);
  
  if (!portfolio || portfolio.USERS_ID !== userId) {
    return null;
  }

  // Get stock details
  const stockRepo = getStockRepository();
  const stock = await stockRepo.findByISIN(holding.ISIN);
  if (!stock) {
    throw new Error('Stock not found');
  }

  // Get latest quote
  const quote = await quoteService.getRealTimeQuote(holding.ISIN);
  const currentPrice = quote.price;
  const totalValue = currentPrice * holding.QUANTITY;

  // Calculate gain/loss
  const transactionRepo = getTransactionRepository();
  const transactions = await transactionRepo.findByHolding(holdingId);
  const costBasis = transactions.reduce((sum, t) => {
    return t.BUY ? sum + (t.AMOUNT * Number(t.PRICE)) : sum - (t.AMOUNT * Number(t.PRICE));
  }, 0);

  const gainLoss = totalValue - costBasis;
  const gainLossPercentage = (gainLoss / costBasis) * 100;

  const holdingDetails: HoldingDetails = {
    ...holding,
    stock: {
      symbol: stock.SYMBOL,
      name: stock.NAME,
      currency: 'USD' // Default since quote doesn't provide currency
    },
    currentPrice,
    totalValue,
    gainLoss,
    gainLossPercentage
  };

  return holdingDetails;
};

export const updateHolding = async (
  holdingId: string,
  userId: string,
  updateData: UpdateHoldingDTO
): Promise<Holding | null> => {
  // First verify ownership
  const holding = await getHoldingById(holdingId, userId);
  if (!holding) {
    return null;
  }

  const holdingRepo = getHoldingRepository();
  return holdingRepo.update(holdingId, {
    QUANTITY: updateData.QUANTITY
  });
};

export const deleteHolding = async (
  holdingId: string,
  userId: string
): Promise<void> => {
  // First verify ownership
  const holding = await getHoldingById(holdingId, userId);
  if (!holding) {
    throw new Error('Holding not found or unauthorized');
  }

  const holdingRepo = getHoldingRepository();
  await holdingRepo.delete(holdingId);
};

export const getHoldingPerformance = async (
  holdingId: string,
  userId: string
): Promise<HoldingPerformance | null> => {
  // First verify ownership
  const holding = await getHoldingById(holdingId, userId);
  if (!holding) {
    return null;
  }

  // Get all transactions for this holding
  const transactionRepo = getTransactionRepository();
  const dbTransactions = await transactionRepo.findByHolding(holdingId);
  const transactions = dbTransactions.map(mapDBTransactionToBFF);

  // Calculate performance metrics
  const totalInvested = transactions.reduce((sum, t) => {
    return t.BUY ? sum + (t.AMOUNT * t.PRICE) : sum - (t.AMOUNT * t.PRICE);
  }, 0);

  // Get current value using latest quote
  const quote = await quoteService.getRealTimeQuote(holding.ISIN);
  const currentValue = quote.price * holding.QUANTITY;
  const totalReturn = currentValue - totalInvested;
  const totalReturnPercentage = (totalReturn / totalInvested) * 100;

  return {
    totalInvested,
    currentValue,
    totalReturn,
    totalReturnPercentage,
    transactions
  };
};

export const getHoldingTransactions = async (
  holdingId: string,
  userId: string
): Promise<Transaction[] | null> => {
  // First verify ownership
  const holding = await getHoldingById(holdingId, userId);
  if (!holding) {
    return null;
  }

  const transactionRepo = getTransactionRepository();
  const dbTransactions = await transactionRepo.findByHolding(holdingId);
  return dbTransactions.map(mapDBTransactionToBFF);
};

export const getHoldingValue = async (
  holdingId: string,
  userId: string
): Promise<HoldingValue | null> => {
  // First verify ownership
  const holding = await getHoldingById(holdingId, userId);
  if (!holding) {
    return null;
  }

  // Get latest transaction for cost basis
  const transactionRepo = getTransactionRepository();
  const dbTransactions = await transactionRepo.findByHolding(holdingId);
  const transactions = dbTransactions.map(mapDBTransactionToBFF);
  
  const costBasis = transactions.reduce((sum, t) => {
    return t.BUY ? sum + (t.AMOUNT * t.PRICE) : sum - (t.AMOUNT * t.PRICE);
  }, 0);

  // Get current value using latest quote
  const quote = await quoteService.getRealTimeQuote(holding.ISIN);
  const currentValue = quote.price * holding.QUANTITY;
  const unrealizedGainLoss = currentValue - costBasis;

  return {
    quantity: holding.QUANTITY,
    costBasis,
    averageCost: costBasis / holding.QUANTITY,
    currentValue,
    unrealizedGainLoss
  };
};

export const getHoldingHistory = async (
  holdingId: string,
  userId: string
): Promise<HoldingHistory[] | null> => {
  // First verify ownership
  const holding = await getHoldingById(holdingId, userId);
  if (!holding) {
    return null;
  }

  const transactionRepo = getTransactionRepository();
  const dbTransactions = await transactionRepo.findByHolding(holdingId);
  const transactions = dbTransactions.map(mapDBTransactionToBFF);

  return transactions.map(t => ({
    date: t.TRANSACTION_TIME,
    buy: t.BUY,
    amount: t.AMOUNT,
    price: t.PRICE,
    value: t.AMOUNT * t.PRICE,
    commission: t.COMMISSION,
    broker: t.BROKER
  }));
};
