import { PrismaClient } from '@prisma/client';
import { Quote, CreateQuoteInput } from '../models/Quote';

export class QuoteRepository {
  constructor(private prisma: PrismaClient) {}

  async create(quote: CreateQuoteInput): Promise<Quote> {
    try {
      // Validate price
      const price = typeof quote.price === 'string' ? parseFloat(quote.price) : Number(quote.price);
      if (price <= 0) {
        throw new Error('Price must be positive');
      }

      return await this.prisma.quote.create({
        data: quote
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('foreign key')) {
          throw new Error('Stock not found');
        }
        if (error.message.includes('Unique constraint')) {
          throw new Error('Quote already exists');
        }
        throw error;
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Quote | null> {
    return await this.prisma.quote.findUnique({
      where: { quote_id: id }
    });
  }

  async findByIsin(isin: string): Promise<Quote[]> {
    return await this.prisma.quote.findMany({
      where: { isin },
      orderBy: {
        market_time: 'desc'
      }
    });
  }

  async findLatestByIsin(isin: string): Promise<Quote | null> {
    return await this.prisma.quote.findFirst({
      where: { isin },
      orderBy: { market_time: 'desc' }
    });
  }

  async update(id: string, quoteData: Partial<CreateQuoteInput>): Promise<Quote> {
    try {
      const existingQuote = await this.findById(id);
      if (!existingQuote) {
        throw new Error('Quote not found');
      }

      // Validate price if provided
      if (quoteData.price !== undefined) {
        const price = typeof quoteData.price === 'string' ? parseFloat(quoteData.price) : Number(quoteData.price);
        if (price <= 0) {
          throw new Error('Price must be positive');
        }
      }

      return await this.prisma.quote.update({
        where: { quote_id: id },
        data: quoteData
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Record to update not found')) {
          throw new Error('Quote not found');
        }
        if (error.message.includes('foreign key')) {
          throw new Error('Stock not found');
        }
        throw error;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Quote> {
    try {
      return await this.prisma.quote.delete({
        where: { quote_id: id }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new Error('Quote not found');
      }
      throw error;
    }
  }
}
