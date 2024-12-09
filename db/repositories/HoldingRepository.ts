import { PrismaClient } from '@prisma/client';
import { Holding } from '../models/Holding';

export class HoldingRepository {
  constructor(private prisma: PrismaClient) {}

  async create(holding: Holding): Promise<Holding> {
    try {
      return await this.prisma.holding.create({
        data: holding
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new Error('Holding already exists');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Holding | null> {
    return await this.prisma.holding.findUnique({
      where: { holdings_id: id }
    });
  }

  async findByPortfolioId(portfolioId: string): Promise<Holding[]> {
    return await this.prisma.holding.findMany({
      where: { portfolios_id: portfolioId }
    });
  }

  async findActiveByPortfolioId(portfolioId: string): Promise<Holding[]> {
    return await this.prisma.holding.findMany({
      where: {
        portfolios_id: portfolioId,
        end_date: null
      }
    });
  }

  async update(id: string, holdingData: Partial<Holding>): Promise<Holding> {
    try {
      const existingHolding = await this.findById(id);
      if (!existingHolding) {
        throw new Error('Holding not found');
      }

      return await this.prisma.holding.update({
        where: { holdings_id: id },
        data: holdingData
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new Error('Holding not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Holding> {
    try {
      return await this.prisma.holding.delete({
        where: { holdings_id: id }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new Error('Holding not found');
      }
      throw error;
    }
  }
}
