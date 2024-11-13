import { getPrismaClient } from '../utils/database';
import { CreateHoldingDTO, UpdateHoldingDTO, HoldingDetails } from '../models/Holding';
import * as stockService from './stockService';
import * as quoteService from './quoteService';
import { HoldingRepository } from '../../../db/repositories/HoldingRepository';
import { TransactionRepository } from '../../../db/repositories/TransactionRepository';
import { QuoteInterval } from '../models/Quote';
import { Decimal } from '@prisma/client/runtime/library';

// Initialize repositories
const prisma = getPrismaClient();
let holdingRepository = new HoldingRepository(prisma);
let transactionRepository = new TransactionRepository(prisma);

// For testing: allow repository injection
export const setHoldingRepository = (repo: any) => {
  holdingRepository = repo;
};

export const setTransactionRepository = (repo: any) => {
  transactionRepository = repo;
};

// Helper function to map DB Holding to API response
const mapDBHoldingToDetails = async (dbHolding: any): Promise<HoldingDetails> => {
  const stock = await stockService.getStockByISIN(dbHolding.ISIN);
  const quotes = await quoteService.getLatestQuotes([dbHolding.ISIN]);
  
  const currentPrice = quotes[0]?.price || 0;
  const totalValue = currentPrice * dbHolding.QUANTITY;

  // Calculate gain/loss using transaction history
  const transactions = await transactionRepository.findByHolding(dbHolding.HOLDINGS_ID);
  const totalCost = await transactionRepository.getTotalValue(dbHolding.HOLDINGS_ID);
  const gainLoss = totalValue - Number(totalCost);
  const gainLossPercentage = Number(totalCost) > 0 ? (gainLoss / Number(totalCost)) * 100 : 0;

  return {
    HOLDINGS_ID: dbHolding.HOLDINGS_ID,
    PORTFOLIOS_ID: dbHolding.PORTFOLIOS_ID,
    ISIN: dbHolding.ISIN,
    QUANTITY: dbHolding.QUANTITY,
    START_DATE: dbHolding.START_DATE,
    END_DATE: dbHolding.END_DATE,
    stock: {
      symbol: stock?.symbol || '',
      name: stock?.name || '',
      currency: stock?.currency || 'USD'
    },
    currentPrice,
    totalValue,
    gainLoss,
    gainLossPercentage
  };
};

export const createHolding = async (
  holdingData: CreateHoldingDTO
): Promise<HoldingDetails> => {
  try {
    // First verify the stock exists
    const stock = await stockService.getStockByISIN(holdingData.ISIN);
    if (!stock) {
      throw new Error('Stock not found');
    }

    // Create the holding using repository
    const dbHolding = await holdingRepository.create({
      HOLDINGS_ID: '', // Will be generated
      PORTFOLIOS_ID: holdingData.PORTFOLIOS_ID,
      ISIN: holdingData.ISIN,
      QUANTITY: holdingData.QUANTITY,
      START_DATE: new Date(),
      END_DATE: null
    });

    // Create initial transaction using repository
    await transactionRepository.create({
      TRANSACTIONS_ID: '', // Will be generated
      HOLDINGS_ID: dbHolding.HOLDINGS_ID,
      BUY: true, // Initial transaction is always a buy
      AMOUNT: holdingData.QUANTITY,
      PRICE: new Decimal(holdingData.PRICE),
      TRANSACTION_TIME: new Date(),
      COMMISSION: new Decimal(0),
      BROKER: 'SYSTEM'
    });

    return await mapDBHoldingToDetails(dbHolding);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create holding');
  }
};

export const getHoldingById = async (
  holdingId: string
): Promise<HoldingDetails | null> => {
  const holding = await holdingRepository.findById(holdingId);

  if (!holding) {
    return null;
  }

  return await mapDBHoldingToDetails(holding);
};

export const getHoldingsByPortfolioId = async (
  portfolioId: string
): Promise<HoldingDetails[]> => {
  const holdings = await holdingRepository.findActiveByPortfolio(portfolioId);
  return Promise.all(holdings.map(mapDBHoldingToDetails));
};

export const updateHolding = async (
  holdingId: string,
  updateData: UpdateHoldingDTO
): Promise<HoldingDetails> => {
  try {
    if (updateData.QUANTITY === undefined) {
      throw new Error('Quantity is required for update');
    }
    const updatedHolding = await holdingRepository.updateQuantity(holdingId, updateData.QUANTITY);
    return await mapDBHoldingToDetails(updatedHolding);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update holding');
  }
};

export const closeHolding = async (holdingId: string): Promise<void> => {
  try {
    await holdingRepository.closeHolding(holdingId, new Date());
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to close holding');
  }
};

export const getHoldingPerformance = async (holdingId: string) => {
  const holding = await holdingRepository.findById(holdingId);
  if (!holding) {
    throw new Error('Holding not found');
  }

  const transactions = await transactionRepository.findByHolding(holdingId);
  const totalCost = await transactionRepository.getTotalValue(holdingId);
  const holdingDetails = await mapDBHoldingToDetails(holding);

  const totalReturn = holdingDetails.gainLoss;
  const percentageReturn = holdingDetails.gainLossPercentage;

  // Calculate holding period in days
  const holdingPeriod = Math.floor(
    (new Date().getTime() - holding.START_DATE.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate annualized return
  const annualizedReturn = 
    holdingPeriod > 0 
      ? (Math.pow(1 + percentageReturn / 100, 365 / holdingPeriod) - 1) * 100
      : 0;

  return {
    totalReturn,
    percentageReturn,
    annualizedReturn,
    holdingPeriod
  };
};

export const getHoldingTransactions = async (holdingId: string) => {
  const holding = await holdingRepository.findById(holdingId);
  if (!holding) {
    throw new Error('Holding not found');
  }

  return await transactionRepository.findByHolding(holdingId);
};

export const getHoldingValue = async (holdingId: string) => {
  const holding = await holdingRepository.findById(holdingId);
  if (!holding) {
    throw new Error('Holding not found');
  }

  const holdingDetails = await mapDBHoldingToDetails(holding);
  const totalCost = await transactionRepository.getTotalValue(holdingId);

  return {
    currentValue: holdingDetails.totalValue,
    costBasis: Number(totalCost),
    unrealizedGainLoss: holdingDetails.gainLoss,
    unrealizedGainLossPercentage: holdingDetails.gainLossPercentage
  };
};

export const getHoldingHistory = async (holdingId: string) => {
  const holding = await holdingRepository.findById(holdingId);
  if (!holding) {
    throw new Error('Holding not found');
  }

  // Get historical quotes for the holding's stock
  const interval: QuoteInterval = {
    interval: '1d',
    range: '1y'
  };
  
  const quoteHistory = await quoteService.getHistoricalQuotes(holding.ISIN, interval);

  // Map quotes to holding history entries
  return quoteHistory.quotes.map(quote => ({
    date: quote.date,
    price: quote.close,
    value: quote.close * holding.QUANTITY
  }));
};
