import { PrismaClient } from '@prisma/client';
import { Quote, CreateQuoteInput } from '../models/Quote';

export class QuoteRepository {
  constructor(private prisma: PrismaClient) {}

  async create(quote: CreateQuoteInput): Promise<Quote> {
    try {
      return await this.prisma.quote.create({
        data: quote
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new Error('Quote already exists');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Quote | null> {
    return await this.prisma.quote.findUnique({
      where: { quotes_id: id }
    });
  }

  async findByIsin(isin: string): Promise<Quote[]> {
    return await this.prisma.quote.findMany({
      where: { isin }
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

      return await this.prisma.quote.update({
        where: { quotes_id: id },
        data: quoteData
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new Error('Quote not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Quote> {
    try {
      return await this.prisma.quote.delete({
        where: { quotes_id: id }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new Error('Quote not found');
      }
      throw error;
    }
  }
}
