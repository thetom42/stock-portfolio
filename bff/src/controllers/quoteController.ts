import type { TypedRequest, TypedResponse, NextFunction, AuthenticatedRequest } from '../types/express';
import { getPrismaClient } from '../utils/database';
import { 
  QuoteRepository, 
  HoldingRepository, 
  PortfolioRepository 
} from '@stock-portfolio/db';
import { 
  QuoteInterval, 
  Quote, 
  RealTimeQuote, 
  HistoricalQuote,
  QuoteHistory 
} from '../models/Quote';
import * as quoteService from '../services/quoteService';

// Define response types
type QuoteResponse = Quote | RealTimeQuote;
type QuotesResponse = { quotes: Quote[] };
type HistoricalQuotesResponse = { quotes: HistoricalQuote[] };
type ErrorResponse = { error: string };

const prisma = getPrismaClient();
const quoteRepository = new QuoteRepository(prisma);
const holdingRepository = new HoldingRepository(prisma);
const portfolioRepository = new PortfolioRepository(prisma);

export const getLatestQuote = async (
  req: TypedRequest<{ isin: string }>,
  res: TypedResponse<QuoteResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const { isin } = req.params;
    
    // Get latest quotes using the service
    const quotes = await quoteService.getLatestQuotes([isin]);
    
    // If we have a non-stale quote, return it as Quote format
    if (quotes.length > 0 && !isQuoteStale(quotes[0].timestamp)) {
      return res.status(200).json(quotes[0]);
    }
    
    // If no quote or stale, get real-time quote and return in RealTimeQuote format
    const realTimeQuote = await quoteService.getRealTimeQuote(isin);
    return res.status(200).json(realTimeQuote);
  } catch (error) {
    next(error);
  }
};

export const getQuoteHistory = async (
  req: TypedRequest<{ isin: string }>,
  res: TypedResponse<HistoricalQuotesResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const { isin } = req.params;
    const interval: QuoteInterval = {
      interval: '1d',
      range: '1mo'
    };
    
    const history = await quoteService.getHistoricalQuotes(isin, interval);
    
    res.status(200).json({ quotes: history.quotes });
  } catch (error) {
    next(error);
  }
};

export const getIntradayQuotes = async (
  req: TypedRequest<{ isin: string }>,
  res: TypedResponse<QuotesResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const { isin } = req.params;
    
    const intraday = await quoteService.getIntradayQuotes(isin);
    
    // Preserve Quote interface structure
    const quotes: Quote[] = intraday.map(quote => ({
      ...quote // Keep all existing Quote properties
    }));
    
    res.status(200).json({ quotes });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioQuotes = async (
  req: AuthenticatedRequest<{ portfolioId: string }>,
  res: TypedResponse<QuotesResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const portfolioId = req.params.portfolioId;
    
    // Verify portfolio ownership
    const portfolio = await portfolioRepository.findById(portfolioId);
    
    if (!portfolio || portfolio.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get holdings
    const holdings = await holdingRepository.findByPortfolioId(portfolioId);
    
    // Get latest quotes for all holdings
    const quotes = await Promise.all(
      holdings.map(holding => quoteService.getLatestQuotes([holding.isin]))
    );
    
    // Flatten and filter out empty results, preserve Quote interface
    const flatQuotes: Quote[] = quotes
      .map(quoteArr => quoteArr[0])
      .filter(quote => quote !== undefined);
    
    res.status(200).json({ quotes: flatQuotes });
  } catch (error) {
    next(error);
  }
};

export const getHoldingQuotes = async (
  req: AuthenticatedRequest<
    { holdingId: string },
    {},
    {},
    { range?: QuoteInterval['range'] }
  >,
  res: TypedResponse<HistoricalQuotesResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.holdingId;
    const range = req.query.range || '1mo';
    
    // Verify holding ownership
    const holding = await holdingRepository.findById(holdingId);
    
    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }
    
    const portfolio = await portfolioRepository.findById(holding.portfolio_id);
    
    if (!portfolio || portfolio.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get quote history
    const interval: QuoteInterval = {
      interval: '1d',
      range
    };
    const history = await quoteService.getHistoricalQuotes(holding.isin, interval);
    
    res.status(200).json({ quotes: history.quotes });
  } catch (error) {
    next(error);
  }
};

// Helper function to check if a quote is older than 15 minutes
function isQuoteStale(timestamp: Date): boolean {
  const fifteenMinutes = 15 * 60 * 1000;
  return Date.now() - timestamp.getTime() > fifteenMinutes;
}
