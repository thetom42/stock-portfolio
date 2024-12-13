import { Category } from '../../src/models/Category';
import { Holding } from '../../src/models/Holding';
import { Portfolio } from '../../src/models/Portfolio';
import { Quote } from '../../src/models/Quote';
import { Stock } from '../../src/models/Stock';
import { Transaction } from '../../src/models/Transaction';
import { User } from '../../src/models/User';

// Extended user interface for authenticated users
interface AuthUser extends User {
  roles?: string[];
}

// User test data
export const mockUsers: Record<string, AuthUser> = {
  regular: {
    id: 'user123',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    roles: ['user'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  admin: {
    id: 'admin123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['user', 'admin'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }
};

// Portfolio test data
export const mockPortfolios: Record<string, Portfolio> = {
  basic: {
    id: 'portfolio123',
    userId: mockUsers.regular.id,
    name: 'My Portfolio',
    description: 'Test portfolio',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }
};

// Category test data
export const mockCategories: Record<string, Category> = {
  tech: {
    category_id: 'cat123',
    name: 'Technology'
  },
  finance: {
    category_id: 'cat456',
    name: 'Financial Services'
  }
};

// Stock test data
export const mockStocks: Record<string, Stock> = {
  apple: {
    id: 'stock123',
    symbol: 'AAPL',
    isin: 'US0378331005',
    name: 'Apple Inc.',
    description: 'Consumer electronics company',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    currency: 'USD',
    exchange: 'NASDAQ',
    country: 'US',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  microsoft: {
    id: 'stock456',
    symbol: 'MSFT',
    isin: 'US5949181045',
    name: 'Microsoft Corporation',
    description: 'Software company',
    sector: 'Technology',
    industry: 'Software',
    currency: 'USD',
    exchange: 'NASDAQ',
    country: 'US',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }
};

// Holding test data
export const mockHoldings: Record<string, Holding> = {
  appleHolding: {
    holding_id: 'holding123',
    portfolio_id: mockPortfolios.basic.id,
    isin: mockStocks.apple.isin,
    quantity: 100,
    start_date: new Date('2023-01-01'),
    end_date: null
  }
};

// Transaction test data
export const mockTransactions: Record<string, Transaction> = {
  buyApple: {
    id: 'trans123',
    holding_id: mockHoldings.appleHolding.holding_id,
    buy: true,
    transaction_time: new Date('2023-01-01'),
    amount: 100,
    price: 150.50,
    commission: 7.99,
    broker: 'TEST_BROKER'
  },
  sellApple: {
    id: 'trans456',
    holding_id: mockHoldings.appleHolding.holding_id,
    buy: false,
    transaction_time: new Date('2023-06-01'),
    amount: 50,
    price: 175.25,
    commission: 7.99,
    broker: 'TEST_BROKER'
  }
};

// Quote test data
export const mockQuotes: Record<string, Quote> = {
  appleQuote: {
    id: 'quote123',
    stockId: mockStocks.apple.id,
    price: 150.50,
    currency: 'USD',
    timestamp: new Date('2023-01-01T12:00:00Z'),
    volume: 1000000,
    open: 149.50,
    high: 152.00,
    low: 148.50,
    close: 150.50,
    adjustedClose: 150.50
  }
};

// Yahoo Finance API response data
export const mockYahooFinanceData = {
  realTimeQuote: {
    price: {
      regularMarketPrice: { raw: 150.50 },
      currency: 'USD',
      exchange: 'NASDAQ',
      regularMarketVolume: { raw: 1000000 },
      regularMarketTime: 1625097600000
    }
  },
  historicalQuotes: {
    prices: [
      {
        date: 1625097600,
        open: 149.50,
        high: 151.00,
        low: 149.00,
        close: 150.50,
        volume: 1000000,
        adjClose: 150.50
      }
    ]
  },
  searchResults: {
    quotes: [
      {
        symbol: 'AAPL',
        longname: 'Apple Inc.',
        shortname: 'Apple',
        exchange: 'NASDAQ',
        quoteType: 'EQUITY'
      }
    ]
  }
};

// Error messages
export const mockErrors = {
  validation: {
    invalidEmail: 'Invalid email address',
    invalidPassword: 'Password must be at least 8 characters long',
    invalidName: 'Name must be at least 2 characters long'
  },
  auth: {
    unauthorized: 'Authentication required',
    forbidden: 'Insufficient permissions',
    invalidToken: 'Invalid or expired token'
  },
  notFound: {
    user: 'User not found',
    portfolio: 'Portfolio not found',
    holding: 'Holding not found',
    stock: 'Stock not found',
    transaction: 'Transaction not found'
  }
};
