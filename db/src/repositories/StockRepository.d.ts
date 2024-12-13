import { PrismaClient } from '@prisma/client';
import { Stock } from '../models/Stock';
export declare class StockRepository {
    private prisma;
    constructor(prisma: PrismaClient);
    create(stock: Stock): Promise<Stock>;
    findByIsin(isin: string): Promise<Stock | null>;
    findBySymbol(symbol: string): Promise<Stock | null>;
    findByWkn(wkn: string): Promise<Stock | null>;
    findAll(): Promise<Stock[]>;
    findByCategory(categoryId: string): Promise<Stock[]>;
    update(isin: string, stockData: Partial<Stock>): Promise<Stock>;
    delete(isin: string): Promise<Stock>;
}
