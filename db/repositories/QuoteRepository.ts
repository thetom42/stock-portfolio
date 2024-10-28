import { PrismaClient, Prisma } from '@prisma/client';
import { Quote, CreateQuoteInput } from '../models/Quote';
import { Decimal } from '@prisma/client/runtime/library';

export class QuoteRepository {
    constructor(private prisma: PrismaClient) {}

    async create(quote: CreateQuoteInput): Promise<Quote> {
        // Check if stock exists
        const stock = await this.prisma.stock.findUnique({
            where: { ISIN: quote.ISIN }
        });
        if (!stock) {
            throw new Error('Stock not found');
        }

        // Convert price to Decimal if it's a number
        const data = {
            ...quote,
            PRICE: quote.PRICE instanceof Decimal ? quote.PRICE : new Decimal(quote.PRICE)
        };

        return this.prisma.quote.create({
            data
        });
    }

    async findById(id: string): Promise<Quote | null> {
        return this.prisma.quote.findUnique({
            where: { QUOTES_ID: id }
        });
    }

    async findByStock(isin: string): Promise<Quote[]> {
        return this.prisma.quote.findMany({
            where: { ISIN: isin },
            orderBy: { MARKET_TIME: 'desc' }
        });
    }

    async findLatestByStock(isin: string): Promise<Quote | null> {
        const quotes = await this.prisma.quote.findMany({
            where: { ISIN: isin },
            orderBy: { MARKET_TIME: 'desc' },
            take: 1
        });
        return quotes[0] || null;
    }

    async findByStockAndTimeRange(
        isin: string,
        startTime: Date,
        endTime: Date
    ): Promise<Quote[]> {
        return this.prisma.quote.findMany({
            where: {
                ISIN: isin,
                MARKET_TIME: {
                    gte: startTime,
                    lte: endTime
                }
            },
            orderBy: { MARKET_TIME: 'asc' }
        });
    }

    async findByExchange(exchange: string): Promise<Quote[]> {
        return this.prisma.quote.findMany({
            where: { EXCHANGE: exchange },
            orderBy: { MARKET_TIME: 'desc' }
        });
    }

    async update(id: string, data: Partial<CreateQuoteInput>): Promise<Quote> {
        const quote = await this.findById(id);
        if (!quote) {
            throw new Error('Quote not found');
        }

        if (data.ISIN) {
            const stock = await this.prisma.stock.findUnique({
                where: { ISIN: data.ISIN }
            });
            if (!stock) {
                throw new Error('Stock not found');
            }
        }

        // Convert price to Decimal if it's provided and is a number
        const updateData = {
            ...data,
            PRICE: data.PRICE instanceof Decimal ? data.PRICE : 
                   data.PRICE !== undefined ? new Decimal(data.PRICE) : undefined
        };

        return this.prisma.quote.update({
            where: { QUOTES_ID: id },
            data: updateData
        });
    }

    async delete(id: string): Promise<Quote> {
        const quote = await this.findById(id);
        if (!quote) {
            throw new Error('Quote not found');
        }

        return this.prisma.quote.delete({
            where: { QUOTES_ID: id }
        });
    }

    async deleteByTimeRange(
        startTime: Date,
        endTime: Date
    ): Promise<number> {
        const result = await this.prisma.quote.deleteMany({
            where: {
                MARKET_TIME: {
                    gte: startTime,
                    lte: endTime
                }
            }
        });
        return result.count;
    }

    async deleteByStock(isin: string): Promise<number> {
        const result = await this.prisma.quote.deleteMany({
            where: { ISIN: isin }
        });
        return result.count;
    }
}
