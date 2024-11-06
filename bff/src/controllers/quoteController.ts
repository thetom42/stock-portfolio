import { Request, Response, NextFunction } from 'express';
import { getQuoteRepository, getHoldingRepository, getPortfolioRepository } from '../utils/database';
import { getYahooFinanceService } from '../services/yahooFinanceService';

export const getLatestQuote = async (
  req: Request<{ isin: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { isin } = req.params;
    const quoteRepo = getQuoteRepository();
    
    // First try to get from local database
    const latestQuote = await quoteRepo.findLatestByStock(isin);
    
    // If quote is older than 15 minutes, fetch new one from Yahoo Finance
    if (!latestQuote || isQuoteStale(latestQuote.MARKET_TIME)) {
      const yahooFinance = getYahooFinanceService();
      const realTimeQuote = await yahooFinance.getRealTimeQuote(isin);
      
      // Save to database
      const newQuote = await quoteRepo.create({
        QUOTES_ID: '', // Will be generated
        ISIN: isin,
        PRICE: realTimeQuote.price,
        CURRENCY: realTimeQuote.currency,
        MARKET_TIME: new Date(),
        EXCHANGE: realTimeQuote.exchange
      });
      
      return res.json(newQuote);
    }
    
    res.json(latestQuote);
  } catch (error) {
    next(error);
  }
};

export const getQuoteHistory = async (
  req: Request<{ isin: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { isin } = req.params;
    const { interval = '1d', range = '1mo' } = req.query;
    
    const yahooFinance = getYahooFinanceService();
    const history = await yahooFinance.getHistoricalQuotes(isin, {
      interval: String(interval),
      range: String(range)
    });
    
    res.json(history);
  } catch (error) {
    next(error);
  }
};

export const getIntradayQuotes = async (
  req: Request<{ isin: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { isin } = req.params;
    
    const yahooFinance = getYahooFinanceService();
    const intraday = await yahooFinance.getIntradayQuotes(isin);
    
    res.json(intraday);
  } catch (error) {
    next(error);
  }
};

export const getPortfolioQuotes = async (
  req: Request<{ portfolioId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { portfolioId } = req.params;
    
    // Verify portfolio ownership
    const portfolioRepo = getPortfolioRepository();
    const portfolio = await portfolioRepo.findById(portfolioId);
    
    if (!portfolio || portfolio.USERS_ID !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Get holdings
    const holdingRepo = getHoldingRepository();
    const holdings = await holdingRepo.findByPortfolio(portfolioId);
    
    // Get latest quotes for all holdings
    const quoteRepo = getQuoteRepository();
    const quotes = await Promise.all(
      holdings.map(holding => quoteRepo.findLatestByStock(holding.ISIN))
    );
    
    // Update stale quotes
    const yahooFinance = getYahooFinanceService();
    const updatedQuotes = await Promise.all(
      quotes.map(async (quote, index) => {
        if (!quote || isQuoteStale(quote.MARKET_TIME)) {
          const isin = holdings[index].ISIN;
          const realTimeQuote = await yahooFinance.getRealTimeQuote(isin);
          
          return quoteRepo.create({
            QUOTES_ID: '', // Will be generated
            ISIN: isin,
            PRICE: realTimeQuote.price,
            CURRENCY: realTimeQuote.currency,
            MARKET_TIME: new Date(),
            EXCHANGE: realTimeQuote.exchange
          });
        }
        return quote;
      })
    );
    
    res.json(updatedQuotes);
  } catch (error) {
    next(error);
  }
};

export const getHoldingQuotes = async (
  req: Request<{ holdingId: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const { holdingId } = req.params;
    const { range = '1mo' } = req.query;
    
    // Verify holding ownership
    const holdingRepo = getHoldingRepository();
    const holding = await holdingRepo.findById(holdingId);
    
    if (!holding) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    
    const portfolioRepo = getPortfolioRepository();
    const portfolio = await portfolioRepo.findById(holding.PORTFOLIOS_ID);
    
    if (!portfolio || portfolio.USERS_ID !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Get quote history
    const yahooFinance = getYahooFinanceService();
    const history = await yahooFinance.getHistoricalQuotes(holding.ISIN, {
      interval: '1d',
      range: String(range)
    });
    
    res.json(history);
  } catch (error) {
    next(error);
  }
};

// Helper function to check if a quote is older than 15 minutes
function isQuoteStale(marketTime: Date): boolean {
  const fifteenMinutes = 15 * 60 * 1000;
  return Date.now() - marketTime.getTime() > fifteenMinutes;
}
