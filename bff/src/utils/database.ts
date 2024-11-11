import { PrismaClient } from '@prisma/client';
import { HoldingRepository } from '../../../db/repositories/HoldingRepository';
import { PortfolioRepository } from '../../../db/repositories/PortfolioRepository';
import { StockRepository } from '../../../db/repositories/StockRepository';
import { UserRepository } from '../../../db/repositories/UserRepository';
import { QuoteRepository } from '../../../db/repositories/QuoteRepository';
import { TransactionRepository } from '../../../db/repositories/TransactionRepository';
import { CategoryRepository } from '../../../db/repositories/CategoryRepository';

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

// Repository type mapping
type RepositoryName = 'holding' | 'portfolio' | 'stock' | 'user' | 'quote' | 'transaction' | 'category';

interface Repositories {
  holding?: HoldingRepository;
  portfolio?: PortfolioRepository;
  stock?: StockRepository;
  user?: UserRepository;
  quote?: QuoteRepository;
  transaction?: TransactionRepository;
  category?: CategoryRepository;
  [key: string]: any;
}

// Initialize repositories with lazy loading
const repositories: Repositories = {};

export function getRepository(name: RepositoryName) {
  if (!repositories[name]) {
    try {
      // Dynamically import and instantiate repository
      const { default: Repository } = require(`../../../db/repositories/${name}Repository`);
      repositories[name] = new Repository(getPrismaClient());
    } catch (error) {
      console.error(`Failed to load repository: ${name}`, error);
      throw new Error(`Repository not found: ${name}`);
    }
  }
  return repositories[name];
}

// Convenience methods for getting specific repositories
export const getHoldingRepository = () => getRepository('holding') as HoldingRepository;
export const getPortfolioRepository = () => getRepository('portfolio') as PortfolioRepository;
export const getStockRepository = () => getRepository('stock') as StockRepository;
export const getUserRepository = () => getRepository('user') as UserRepository;
export const getQuoteRepository = () => getRepository('quote') as QuoteRepository;
export const getTransactionRepository = () => getRepository('transaction') as TransactionRepository;
export const getCategoryRepository = () => getRepository('category') as CategoryRepository;

// Export repository types for use in services
export type {
  HoldingRepository,
  PortfolioRepository,
  StockRepository,
  UserRepository,
  QuoteRepository,
  TransactionRepository,
  CategoryRepository
};
