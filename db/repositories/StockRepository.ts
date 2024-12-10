import { PrismaClient } from '@prisma/client';
import { Stock } from '../models/Stock';

export class StockRepository {
  constructor(private prisma: PrismaClient) {}

  async create(stock: Stock): Promise<Stock> {
    try {
      return await this.prisma.stock.create({
        data: stock
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new Error('Stock already exists');
      }
      throw error;
    }
  }

  async findByIsin(isin: string): Promise<Stock | null> {
    return await this.prisma.stock.findUnique({
      where: { isin }
    });
  }

  async findAll(): Promise<Stock[]> {
    return await this.prisma.stock.findMany();
  }

  async findByCategory(categoryId: string): Promise<Stock[]> {
    return await this.prisma.stock.findMany({
      where: { category_id: categoryId }
    });
  }

  async update(isin: string, stockData: Partial<Stock>): Promise<Stock> {
    try {
      const existingStock = await this.findByIsin(isin);
      if (!existingStock) {
        throw new Error('Stock not found');
      }

      return await this.prisma.stock.update({
        where: { isin },
        data: stockData
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new Error('Stock not found');
      }
      throw error;
    }
  }

  async delete(isin: string): Promise<Stock> {
    try {
      return await this.prisma.stock.delete({
        where: { isin }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new Error('Stock not found');
      }
      throw error;
    }
  }
}
