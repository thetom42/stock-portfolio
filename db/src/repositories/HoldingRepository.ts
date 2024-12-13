import { PrismaClient } from '@prisma/client';
import { Holding } from '../models/Holding';

export class HoldingRepository {
  constructor(private prisma: PrismaClient) {}

  async create(holding: Holding): Promise<Holding> {
    try {
      // Validate quantity
      if (holding.quantity <= 0) {
        throw new Error('Quantity must be positive');
      }

      // Validate dates if end_date is provided
      if (holding.end_date && holding.start_date > holding.end_date) {
        throw new Error('Start date must be before end date');
      }

      // First check if portfolio exists
      const portfolio = await this.prisma.portfolio.findUnique({
        where: { portfolio_id: holding.portfolio_id }
      });
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Then check if stock exists
      const stock = await this.prisma.stock.findUnique({
        where: { isin: holding.isin }
      });
      if (!stock) {
        throw new Error('Stock not found');
      }

      return await this.prisma.holding.create({
        data: holding
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Portfolio not found' || error.message === 'Stock not found') {
          throw error;
        }
        if (error.message.includes('Unique constraint')) {
          throw new Error('Holding already exists');
        }
        throw error;
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Holding | null> {
    return await this.prisma.holding.findUnique({
      where: { holding_id: id }
    });
  }

  async findByPortfolioId(portfolioId: string): Promise<Holding[]> {
    return await this.prisma.holding.findMany({
      where: { portfolio_id: portfolioId },
      orderBy: {
        start_date: 'desc'
      }
    });
  }

  async findActiveByPortfolioId(portfolioId: string): Promise<Holding[]> {
    return await this.prisma.holding.findMany({
      where: {
        portfolio_id: portfolioId,
        end_date: null
      },
      orderBy: {
        start_date: 'desc'
      }
    });
  }

  async update(id: string, holdingData: Partial<Holding>): Promise<Holding> {
    try {
      const existingHolding = await this.findById(id);
      if (!existingHolding) {
        throw new Error('Holding not found');
      }

      // Validate quantity if provided
      if (holdingData.quantity !== undefined && holdingData.quantity <= 0) {
        throw new Error('Quantity must be positive');
      }

      // Validate dates if end_date is provided
      if (holdingData.end_date && 
          (holdingData.start_date || existingHolding.start_date) > holdingData.end_date) {
        throw new Error('Start date must be before end date');
      }

      // Check portfolio if portfolio_id is being updated
      if (holdingData.portfolio_id) {
        const portfolio = await this.prisma.portfolio.findUnique({
          where: { portfolio_id: holdingData.portfolio_id }
        });
        if (!portfolio) {
          throw new Error('Portfolio not found');
        }
      }

      // Check stock if isin is being updated
      if (holdingData.isin) {
        const stock = await this.prisma.stock.findUnique({
          where: { isin: holdingData.isin }
        });
        if (!stock) {
          throw new Error('Stock not found');
        }
      }

      return await this.prisma.holding.update({
        where: { holding_id: id },
        data: holdingData
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Portfolio not found' || 
            error.message === 'Stock not found' || 
            error.message === 'Holding not found') {
          throw error;
        }
        throw error;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Holding> {
    try {
      // Check if holding has transactions
      const transactions = await this.prisma.transaction.findMany({
        where: { holding_id: id }
      });

      if (transactions.length > 0) {
        throw new Error('Cannot delete holding with associated transactions');
      }

      return await this.prisma.holding.delete({
        where: { holding_id: id }
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Cannot delete holding with associated transactions') {
          throw error;
        }
        if (error.message.includes('Record to delete does not exist')) {
          throw new Error('Holding not found');
        }
        throw error;
      }
      throw error;
    }
  }
}
