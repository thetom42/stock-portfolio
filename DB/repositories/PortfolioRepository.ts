import { PrismaClient } from '@prisma/client';
import { Portfolio } from '../models/Portfolio';

interface PrismaError {
  code: string;
  meta?: {
    field_name?: string;
  };
}

export class PortfolioRepository {
  constructor(private prisma: PrismaClient) {}

  async create(portfolio: Portfolio): Promise<Portfolio> {
    try {
      return await this.prisma.portfolio.create({
        data: portfolio
      });
    } catch (error) {
      const prismaError = error as PrismaError;
      if (
        prismaError.code === 'P2003' &&
        prismaError.meta?.field_name === 'foreign key'
      ) {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Portfolio | null> {
    return await this.prisma.portfolio.findUnique({
      where: { PORTFOLIOS_ID: id }
    });
  }

  async findByUserId(userId: string): Promise<Portfolio[]> {
    return await this.prisma.portfolio.findMany({
      where: { USERS_ID: userId }
    });
  }

  async update(id: string, data: Partial<Portfolio>): Promise<Portfolio> {
    try {
      return await this.prisma.portfolio.update({
        where: { PORTFOLIOS_ID: id },
        data
      });
    } catch (error) {
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new Error('Portfolio not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Portfolio> {
    try {
      return await this.prisma.portfolio.delete({
        where: { PORTFOLIOS_ID: id }
      });
    } catch (error) {
      const prismaError = error as PrismaError;
      if (prismaError.code === 'P2025') {
        throw new Error('Portfolio not found');
      }
      throw error;
    }
  }
}
