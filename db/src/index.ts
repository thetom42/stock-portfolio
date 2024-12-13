import { PrismaClient } from '@prisma/client';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { HoldingRepository } from '../repositories/HoldingRepository';
import { PortfolioRepository } from '../repositories/PortfolioRepository';
import { QuoteRepository } from '../repositories/QuoteRepository';
import { StockRepository } from '../repositories/StockRepository';
import { TransactionRepository } from '../repositories/TransactionRepository';
import { UserRepository } from '../repositories/UserRepository';

// Export repositories
export {
    CategoryRepository,
    HoldingRepository,
    PortfolioRepository,
    QuoteRepository,
    StockRepository,
    TransactionRepository,
    UserRepository
};

// Export Prisma client instance
export const prisma = new PrismaClient();

// Export Prisma types
export * from '@prisma/client';
