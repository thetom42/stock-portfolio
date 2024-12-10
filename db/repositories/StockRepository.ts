import { PrismaClient } from '@prisma/client';
import { Stock } from '../models/Stock';

export class StockRepository {
  constructor(private prisma: PrismaClient) {}

  async create(stock: Stock): Promise<Stock> {
    try {
      // First check if category exists
      const category = await this.prisma.category.findUnique({
        where: { category_id: stock.category_id }
      });
      if (!category) {
        throw new Error('Category not found');
      }

      // Then check if stock with same ISIN exists
      const existingStockByIsin = await this.prisma.stock.findUnique({
        where: { isin: stock.isin }
      });
      if (existingStockByIsin) {
        throw new Error('Stock with this ISIN already exists');
      }

      // Check if stock with same WKN exists
      const existingStockByWkn = await this.prisma.stock.findFirst({
        where: { wkn: stock.wkn }
      });
      if (existingStockByWkn) {
        throw new Error('Stock with this WKN already exists');
      }

      // Check if stock with same symbol exists
      const existingStockBySymbol = await this.prisma.stock.findFirst({
        where: { symbol: stock.symbol }
      });
      if (existingStockBySymbol) {
        throw new Error('Stock with this SYMBOL already exists');
      }

      return await this.prisma.stock.create({
        data: stock
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Category not found' ||
            error.message === 'Stock with this ISIN already exists' ||
            error.message === 'Stock with this WKN already exists' ||
            error.message === 'Stock with this SYMBOL already exists') {
          throw error;
        }
        throw error;
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
    return await this.prisma.stock.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  }

  async findByCategory(categoryId: string): Promise<Stock[]> {
    return await this.prisma.stock.findMany({
      where: { category_id: categoryId },
      orderBy: {
        name: 'asc'
      }
    });
  }

  async update(isin: string, stockData: Partial<Stock>): Promise<Stock> {
    try {
      const existingStock = await this.findByIsin(isin);
      if (!existingStock) {
        throw new Error('Stock not found');
      }

      // Check category if being updated
      if (stockData.category_id) {
        const category = await this.prisma.category.findUnique({
          where: { category_id: stockData.category_id }
        });
        if (!category) {
          throw new Error('Category not found');
        }
      }

      // Check WKN if being updated
      if (stockData.wkn) {
        const existingStockByWkn = await this.prisma.stock.findFirst({
          where: { 
            wkn: stockData.wkn,
            isin: { not: isin }
          }
        });
        if (existingStockByWkn) {
          throw new Error('Stock with this WKN already exists');
        }
      }

      // Check symbol if being updated
      if (stockData.symbol) {
        const existingStockBySymbol = await this.prisma.stock.findFirst({
          where: { 
            symbol: stockData.symbol,
            isin: { not: isin }
          }
        });
        if (existingStockBySymbol) {
          throw new Error('Stock with this SYMBOL already exists');
        }
      }

      return await this.prisma.stock.update({
        where: { isin },
        data: stockData
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Stock not found' ||
            error.message === 'Category not found' ||
            error.message === 'Stock with this WKN already exists' ||
            error.message === 'Stock with this SYMBOL already exists') {
          throw error;
        }
        throw error;
      }
      throw error;
    }
  }

  async delete(isin: string): Promise<Stock> {
    try {
      // Check if stock has any holdings
      const holdings = await this.prisma.holding.findMany({
        where: { isin }
      });

      if (holdings.length > 0) {
        throw new Error('Cannot delete stock with associated holdings');
      }

      return await this.prisma.stock.delete({
        where: { isin }
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Cannot delete stock with associated holdings') {
          throw error;
        }
        if (error.message.includes('Record to delete does not exist')) {
          throw new Error('Stock not found');
        }
        throw error;
      }
      throw error;
    }
  }
}
