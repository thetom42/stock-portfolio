import { getPrismaClient } from '../utils/database';
import { CreateHoldingDTO, UpdateHoldingDTO, HoldingDetails } from '../models/Holding';
import * as stockService from './stockService';
import * as quoteService from './quoteService';
import { HoldingRepository } from '../../../db/repositories/HoldingRepository';
import { TransactionRepository } from '../../../db/repositories/TransactionRepository';
import { QuoteInterval } from '../models/Quote';
import { Decimal } from '@prisma/client/runtime/library';
import { Holding } from '../../../db/models/Holding';
import { CreateTransactionInput } from '../../../db/models/Transaction';

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
const mapDBHoldingToDetails = async (dbHolding: Holding): Promise<HoldingDetails> => {
  const stock = await stockService.getStockByIsin(dbHolding.isin);
  const quotes = await quoteService.getLatestQuotes([dbHolding.isin]);
  
  const currentPrice = quotes[0]?.price || 0;
  const totalValue = currentPrice * dbHolding.quantity;

  // Calculate gain/loss using transaction history
  const transactions = await transactionRepository.findByHoldingId(dbHolding.holding_id);
  const totalCost = await calculateTotalValue(dbHolding.holding_id);
  const gainLoss = totalValue - Number(totalCost);
  const gainLossPercentage = Number(totalCost) > 0 ? (gainLoss / Number(totalCost)) * 100 : 0;

  return {
    holding_id: dbHolding.holding_id,
    portfolio_id: dbHolding.portfolio_id,
    isin: dbHolding.isin,
    quantity: dbHolding.quantity,
    start_date: dbHolding.start_date,
    end_date: dbHolding.end_date,
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

// Helper function to calculate total value
const calculateTotalValue = async (holdingId: string): Promise<Decimal> => {
  const transactions = await transactionRepository.findByHoldingId(holdingId);
  return transactions.reduce((total, t) => {
    const value = t.price.mul(t.amount);
    return t.buy ? total.add(value) : total.sub(value);
  }, new Decimal(0));
};

export const createHolding = async (
  holdingData: CreateHoldingDTO
): Promise<HoldingDetails> => {
  try {
    // First verify the stock exists
    const stock = await stockService.getStockByIsin(holdingData.isin);
    if (!stock) {
      throw new Error('Stock not found');
    }

    // Create the holding using repository
    const dbHolding = await holdingRepository.create({
      holding_id: '', // Will be generated
      portfolio_id: holdingData.portfolio_id,
      isin: holdingData.isin,
      quantity: holdingData.quantity,
      start_date: new Date(),
      end_date: null
    });

    // Create initial transaction using repository
    const transactionInput: CreateTransactionInput = {
      transaction_id: '', // Will be generated
      holding_id: dbHolding.holding_id,
      buy: true, // Initial transaction is always a buy
      amount: holdingData.quantity,
      price: new Decimal(holdingData.price),
      transaction_time: new Date(),
      commission: new Decimal(0),
      broker: 'SYSTEM'
    };
    await transactionRepository.create(transactionInput);

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
  const holdings = await holdingRepository.findActiveByPortfolioId(portfolioId);
  return Promise.all(holdings.map(mapDBHoldingToDetails));
};

export const updateHolding = async (
  holdingId: string,
  updateData: UpdateHoldingDTO
): Promise<HoldingDetails> => {
  try {
    if (updateData.quantity === undefined) {
      throw new Error('Quantity is required for update');
    }
    const updatedHolding = await holdingRepository.update(holdingId, {
      quantity: updateData.quantity
    });
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
    await holdingRepository.update(holdingId, {
      end_date: new Date()
    });
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

  const transactions = await transactionRepository.findByHoldingId(holdingId);
  const totalCost = await calculateTotalValue(holdingId);
  const holdingDetails = await mapDBHoldingToDetails(holding);

  const totalReturn = holdingDetails.gainLoss;
  const percentageReturn = holdingDetails.gainLossPercentage;

  // Calculate holding period in days
  const holdingPeriod = Math.floor(
    (new Date().getTime() - holding.start_date.getTime()) / (1000 * 60 * 60 * 24)
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

  return await transactionRepository.findByHoldingId(holdingId);
};

export const getHoldingValue = async (holdingId: string) => {
  const holding = await holdingRepository.findById(holdingId);
  if (!holding) {
    throw new Error('Holding not found');
  }

  const holdingDetails = await mapDBHoldingToDetails(holding);
  const totalCost = await calculateTotalValue(holdingId);

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
  
  const quoteHistory = await quoteService.getHistoricalQuotes(holding.isin, interval);

  // Map quotes to holding history entries
  return quoteHistory.quotes.map(quote => ({
    date: quote.date,
    price: quote.close,
    value: quote.close * holding.quantity
  }));
};
