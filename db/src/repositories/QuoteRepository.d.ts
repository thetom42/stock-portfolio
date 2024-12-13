import { PrismaClient } from '@prisma/client';
import { Quote, CreateQuoteInput } from '../models/Quote';
export declare class QuoteRepository {
    private prisma;
    constructor(prisma: PrismaClient);
    create(quote: CreateQuoteInput): Promise<Quote>;
    findById(id: string): Promise<Quote | null>;
    findByIsin(isin: string): Promise<Quote[]>;
    findLatestByIsin(isin: string): Promise<Quote | null>;
    update(id: string, quoteData: Partial<CreateQuoteInput>): Promise<Quote>;
    delete(id: string): Promise<Quote>;
}
