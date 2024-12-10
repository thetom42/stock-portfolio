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
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new Error('Portfolio already exists');
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
      where: { user_id: userId }
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
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new Error('Portfolio not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Portfolio> {
    try {
      return await this.prisma.portfolio.delete({
        where: { portfolio_id: id }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new Error('Portfolio not found');
      }
      throw error;
    }
  }
}
