import { PrismaClient } from '@prisma/client';
import { Portfolio } from '../models/Portfolio';

export class PortfolioRepository {
  constructor(private prisma: PrismaClient) {}

  async create(portfolio: Portfolio): Promise<Portfolio> {
    try {
      return await this.prisma.portfolio.create({
        data: portfolio
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('foreign key')) {
          throw new Error('User not found');
        }
        if (error.message.includes('Unique constraint')) {
          throw new Error('Portfolio already exists');
        }
        throw error;
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Portfolio | null> {
    return await this.prisma.portfolio.findUnique({
      where: { portfolio_id: id }
    });
  }

  async findByUserId(userId: string): Promise<Portfolio[]> {
    return await this.prisma.portfolio.findMany({
      where: { user_id: userId },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async update(id: string, portfolioData: Partial<Portfolio>): Promise<Portfolio> {
    try {
      const existingPortfolio = await this.findById(id);
      if (!existingPortfolio) {
        throw new Error('Portfolio not found');
      }

      return await this.prisma.portfolio.update({
        where: { portfolio_id: id },
        data: portfolioData
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Record to update not found')) {
          throw new Error('Portfolio not found');
        }
        if (error.message.includes('foreign key')) {
          throw new Error('User not found');
        }
        throw error;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Portfolio> {
    try {
      // Check if portfolio has any holdings
      const holdings = await this.prisma.holding.findMany({
        where: { portfolio_id: id }
      });

      if (holdings.length > 0) {
        throw new Error('Cannot delete portfolio with associated holdings');
      }

      return await this.prisma.portfolio.delete({
        where: { portfolio_id: id }
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Cannot delete portfolio with associated holdings') {
          throw error;
        }
        if (error.message.includes('Record to delete does not exist')) {
          throw new Error('Portfolio not found');
        }
        throw error;
      }
      throw error;
    }
  }
}
