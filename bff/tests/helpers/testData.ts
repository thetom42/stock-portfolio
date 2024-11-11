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
    CATEGORIES_ID: 'cat123',
    NAME: 'Technology'
  },
  finance: {
    CATEGORIES_ID: 'cat456',
    NAME: 'Financial Services'
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
    HOLDINGS_ID: 'holding123',
    PORTFOLIOS_ID: mockPortfolios.basic.id,
    ISIN: mockStocks.apple.isin,
    QUANTITY: 100,
    START_DATE: new Date('2023-01-01'),
    END_DATE: null
  }
};

// Transaction test data
export const mockTransactions: Record<string, Transaction> = {
  buyApple: {
    TRANSACTIONS_ID: 'trans123',
    HOLDINGS_ID: mockHoldings.appleHolding.HOLDINGS_ID,
    BUY: true,
    TRANSACTION_TIME: new Date('2023-01-01'),
    AMOUNT: 100,
    PRICE: 150.50,
    COMMISSION: 7.99,
    BROKER: 'TEST_BROKER'
  },
  sellApple: {
    TRANSACTIONS_ID: 'trans456',
    HOLDINGS_ID: mockHoldings.appleHolding.HOLDINGS_ID,
    BUY: false,
    TRANSACTION_TIME: new Date('2023-06-01'),
    AMOUNT: 50,
    PRICE: 175.25,
    COMMISSION: 7.99,
    BROKER: 'TEST_BROKER'
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
