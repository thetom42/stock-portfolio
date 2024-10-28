import { PrismaClient } from '@prisma/client';
import { Stock } from '../models/Stock';

export class StockRepository {
    constructor(private prisma: PrismaClient) {}

    async create(stock: Stock): Promise<Stock> {
        // Check if category exists
        const category = await this.prisma.category.findUnique({
            where: { CATEGORIES_ID: stock.CATEGORIES_ID }
        });
        if (!category) {
            throw new Error('Category not found');
        }

        // Check if stock with ISIN already exists
        const existingStock = await this.findByISIN(stock.ISIN);
        if (existingStock) {
            throw new Error('Stock with this ISIN already exists');
        }

        // Check if WKN or SYMBOL already exists
        const existingByWKN = await this.findByWKN(stock.WKN);
        if (existingByWKN) {
            throw new Error('Stock with this WKN already exists');
        }

        const existingBySymbol = await this.findBySymbol(stock.SYMBOL);
        if (existingBySymbol) {
            throw new Error('Stock with this SYMBOL already exists');
        }

        return this.prisma.stock.create({
            data: stock
        });
    }

    async findByISIN(isin: string): Promise<Stock | null> {
        return this.prisma.stock.findUnique({
            where: { ISIN: isin }
        });
    }

    async findByWKN(wkn: string): Promise<Stock | null> {
        return this.prisma.stock.findFirst({
            where: { WKN: wkn }
        });
    }

    async findBySymbol(symbol: string): Promise<Stock | null> {
        return this.prisma.stock.findFirst({
            where: { SYMBOL: symbol }
        });
    }

    async findByCategory(categoryId: string): Promise<Stock[]> {
        return this.prisma.stock.findMany({
            where: { CATEGORIES_ID: categoryId }
        });
    }

    async findAll(): Promise<Stock[]> {
        return this.prisma.stock.findMany();
    }

    async update(isin: string, data: Partial<Stock>): Promise<Stock> {
        const stock = await this.findByISIN(isin);
        if (!stock) {
            throw new Error('Stock not found');
        }

        if (data.CATEGORIES_ID) {
            const category = await this.prisma.category.findUnique({
                where: { CATEGORIES_ID: data.CATEGORIES_ID }
            });
            if (!category) {
                throw new Error('Category not found');
            }
        }

        if (data.WKN) {
            const existingByWKN = await this.findByWKN(data.WKN);
            if (existingByWKN && existingByWKN.ISIN !== isin) {
                throw new Error('Stock with this WKN already exists');
            }
        }

        if (data.SYMBOL) {
            const existingBySymbol = await this.findBySymbol(data.SYMBOL);
            if (existingBySymbol && existingBySymbol.ISIN !== isin) {
                throw new Error('Stock with this SYMBOL already exists');
            }
        }

        return this.prisma.stock.update({
            where: { ISIN: isin },
            data
        });
    }

    async delete(isin: string): Promise<Stock> {
        const stock = await this.findByISIN(isin);
        if (!stock) {
            throw new Error('Stock not found');
        }

        return this.prisma.stock.delete({
            where: { ISIN: isin }
        });
    }
}
