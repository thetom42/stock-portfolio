import { getPrismaClient } from '../utils/database';
import { CreateHoldingDTO, UpdateHoldingDTO, HoldingDetails } from '../models/Holding';
import { Transaction as BFFTransaction } from '../models/Transaction';
import { stockService } from './stockService';
import { quoteService } from './quoteService';
import {
  HoldingRepository,
  TransactionRepository
} from '@stock-portfolio/db';
import type { Holding } from '@stock-portfolio/db/dist/models/Holding';
import type { Transaction as DBTransaction } from '@stock-portfolio/db/dist/models/Transaction';
import { QuoteInterval } from '../models/Quote';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to map DB Transaction to BFF Transaction
const mapDBTransactionToBFF = (dbTransaction: DBTransaction): BFFTransaction => ({
  id: dbTransaction.transaction_id,
  holdingId: dbTransaction.holding_id,
  buy: dbTransaction.buy,
  transactionTime: dbTransaction.transaction_time,
  amount: dbTransaction.amount,
  price: Number(dbTransaction.price),
  commission: Number(dbTransaction.commission),
  broker: dbTransaction.broker
});

class HoldingService {
  private holdingRepository: HoldingRepository;
  private transactionRepository: TransactionRepository;
  private static instance: HoldingService;

  private constructor() {
    const prisma = getPrismaClient();
    this.holdingRepository = new HoldingRepository(prisma);
    this.transactionRepository = new TransactionRepository(prisma);
  }

  static getInstance(): HoldingService {
    if (!HoldingService.instance) {
      HoldingService.instance = new HoldingService();
    }
    return HoldingService.instance;
  }

  // For testing purposes
  setHoldingRepository(repo: HoldingRepository): void {
    this.holdingRepository = repo;
  }

  setTransactionRepository(repo: TransactionRepository): void {
    this.transactionRepository = repo;
  }

  // Helper function to map DB Holding to API response
  private async mapDBHoldingToDetails(dbHolding: Holding): Promise<HoldingDetails> {
    const stock = await stockService.getStockByIsin(dbHolding.isin);
    const quotes = await quoteService.getLatestQuotes([dbHolding.isin]);

    const currentPrice = quotes[0]?.price || 0;
    const totalValue = currentPrice * dbHolding.quantity;

    // Calculate gain/loss using transaction history
    const transactions = await this.transactionRepository.findByHoldingId(dbHolding.holding_id);
    const totalCost = await this.calculateTotalValue(dbHolding.holding_id);
    const gainLoss = totalValue - Number(totalCost);
    const gainLossPercentage = Number(totalCost) > 0 ? (gainLoss / Number(totalCost)) * 100 : 0;

    return {
      id: dbHolding.holding_id,
      portfolioId: dbHolding.portfolio_id,
      isin: dbHolding.isin,
      quantity: dbHolding.quantity,
      startDate: dbHolding.start_date,
      endDate: dbHolding.end_date,
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
  }

  // Helper function to calculate total value
  private async calculateTotalValue(holdingId: string): Promise<Decimal> {
    const transactions = await this.transactionRepository.findByHoldingId(holdingId);
    return transactions.reduce((total, t) => {
      const value = t.price.mul(t.amount);
      return t.buy ? total.add(value) : total.sub(value);
    }, new Decimal(0));
  }

  async createHolding(holdingData: CreateHoldingDTO): Promise<HoldingDetails> {
    try {
      // First verify the stock exists
      const stock = await stockService.getStockByIsin(holdingData.isin);
      if (!stock) {
        throw new Error('Stock not found');
      }

      // Create the holding using repository
      const dbHolding = await this.holdingRepository.create({
        holding_id: '', // Will be generated
        portfolio_id: holdingData.portfolioId,
        isin: holdingData.isin,
        quantity: holdingData.quantity,
        start_date: new Date(),
        end_date: null
      });

      // Create initial transaction using repository
      await this.transactionRepository.create({
        transaction_id: '', // Will be generated
        holding_id: dbHolding.holding_id,
        buy: true, // Initial transaction is always a buy
        amount: holdingData.quantity,
        price: holdingData.price,
        transaction_time: new Date(),
        commission: 0,
        broker: 'SYSTEM'
      });

      return await this.mapDBHoldingToDetails(dbHolding);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create holding');
    }
  }

  async getHoldingById(holdingId: string): Promise<HoldingDetails | null> {
    const holding = await this.holdingRepository.findById(holdingId);

    if (!holding) {
      return null;
    }

    return await this.mapDBHoldingToDetails(holding);
  }

  async getHoldingsByPortfolioId(portfolioId: string): Promise<HoldingDetails[]> {
    const holdings = await this.holdingRepository.findActiveByPortfolioId(portfolioId);
    return Promise.all(holdings.map(h => this.mapDBHoldingToDetails(h)));
  }

  async updateHolding(holdingId: string, updateData: UpdateHoldingDTO): Promise<HoldingDetails> {
    try {
      if (updateData.quantity === undefined) {
        throw new Error('Quantity is required for update');
      }
      const updatedHolding = await this.holdingRepository.update(holdingId, {
        quantity: updateData.quantity
      });
      return await this.mapDBHoldingToDetails(updatedHolding);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update holding');
    }
  }

  async closeHolding(holdingId: string): Promise<void> {
    try {
      await this.holdingRepository.update(holdingId, {
        end_date: new Date()
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to close holding');
    }
  }

  async getHoldingPerformance(holdingId: string) {
    const holding = await this.holdingRepository.findById(holdingId);
    if (!holding) {
      throw new Error('Holding not found');
    }

    const holdingDetails = await this.mapDBHoldingToDetails(holding);
    const totalCost = await this.calculateTotalValue(holdingId);

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
  }

  async getHoldingTransactions(holdingId: string): Promise<BFFTransaction[]> {
    const holding = await this.holdingRepository.findById(holdingId);
    if (!holding) {
      throw new Error('Holding not found');
    }

    const dbTransactions = await this.transactionRepository.findByHoldingId(holdingId);
    return dbTransactions.map(mapDBTransactionToBFF);
  }

  async getHoldingValue(holdingId: string) {
    const holding = await this.holdingRepository.findById(holdingId);
    if (!holding) {
      throw new Error('Holding not found');
    }

    const holdingDetails = await this.mapDBHoldingToDetails(holding);
    const totalCost = await this.calculateTotalValue(holdingId);

    return {
      currentValue: holdingDetails.totalValue,
      costBasis: Number(totalCost),
      unrealizedGainLoss: holdingDetails.gainLoss,
      unrealizedGainLossPercentage: holdingDetails.gainLossPercentage
    };
  }

  async getHoldingHistory(holdingId: string) {
    const holding = await this.holdingRepository.findById(holdingId);
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
  }
}

// Export singleton instance
export const holdingService = HoldingService.getInstance();

// For testing purposes
export const setHoldingRepository = (repo: HoldingRepository) => {
  holdingService.setHoldingRepository(repo);
  return holdingService;
};

export const setTransactionRepository = (repo: TransactionRepository) => {
  holdingService.setTransactionRepository(repo);
  return holdingService;
};
