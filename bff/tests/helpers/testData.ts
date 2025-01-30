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
    createdAt: new Date('2023-01-01')
  },
  admin: {
    id: 'admin123',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['user', 'admin'],
    createdAt: new Date('2023-01-01')
  }
};

// Portfolio test data
export const mockPortfolios: Record<string, Portfolio> = {
  basic: {
    id: 'portfolio123',
    userId: mockUsers.regular.id,
    name: 'My Portfolio',
    createdAt: new Date('2023-01-01')
  }
};

// Category test data
export const mockCategories: Record<string, Category> = {
  tech: {
    id: 'cat123',
    name: 'Technology'
  },
  finance: {
    id: 'cat456',
    name: 'Financial Services'
  }
};

// Stock test data
export const mockStocks: Record<string, Stock> = {
  apple: {
    isin: 'US0378331005',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    wkn: '865985'
  },
  microsoft: {
    isin: 'US5949181045',
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    wkn: '870747'
  }
};

// Holding test data
export const mockHoldings: Record<string, Holding> = {
  appleHolding: {
    id: 'holding123',
    portfolioId: mockPortfolios.basic.id,
    isin: mockStocks.apple.isin,
    quantity: 100,
    startDate: new Date('2023-01-01'),
    endDate: null
  }
};

// Transaction test data
export const mockTransactions: Record<string, Transaction> = {
  buyApple: {
    id: 'trans123',
    holdingId: mockHoldings.appleHolding.id,
    buy: true,
    transactionTime: new Date('2023-01-01'),
    amount: 100,
    price: 150.50,
    commission: 7.99,
    broker: 'TEST_BROKER'
  },
  sellApple: {
    id: 'trans456',
    holdingId: mockHoldings.appleHolding.id,
    buy: false,
    transactionTime: new Date('2023-06-01'),
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
    isin: mockStocks.apple.isin,
    price: 150.50,
    currency: 'USD',
    exchange: 'NASDAQ',
    timestamp: new Date('2023-01-01T12:00:00Z')
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
