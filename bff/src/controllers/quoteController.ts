import type { Request, Response, NextFunction } from 'express-serve-static-core';
import { getPrismaClient } from '../utils/database';
import { AuthenticatedRequest } from '../types/express';
import { QuoteRepository } from '../../../db/repositories/QuoteRepository';
import { HoldingRepository } from '../../../db/repositories/HoldingRepository';
import { PortfolioRepository } from '../../../db/repositories/PortfolioRepository';
import { QuoteInterval } from '../models/Quote';
import * as quoteService from '../services/quoteService';

const prisma = getPrismaClient();
const quoteRepository = new QuoteRepository(prisma);
const holdingRepository = new HoldingRepository(prisma);
const portfolioRepository = new PortfolioRepository(prisma);

export const getLatestQuote = async (
  req: Request<{ isin: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { isin } = req.params;
    
    // Get latest quotes using the service
    const quotes = await quoteService.getLatestQuotes([isin]);
    
    // If we have a non-stale quote, return it
    if (quotes.length > 0 && !isQuoteStale(quotes[0].timestamp)) {
      return res.status(200).json(quotes[0]);
    }
    
    // If no quote or stale, get real-time quote
    const realTimeQuote = await quoteService.getRealTimeQuote(isin);
    
    // Return the real-time quote data
    return res.status(200).json({
      price: realTimeQuote.price,
      change: realTimeQuote.change,
      changePercent: realTimeQuote.changePercent,
      timestamp: realTimeQuote.timestamp
    });
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
  req: Request<{ isin: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { isin } = req.params;
    
    const intraday = await quoteService.getIntradayQuotes(isin);
    
    res.status(200).json({ quotes: intraday });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioQuotes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const portfolioId = req.params.portfolioId;
    
    // Verify portfolio ownership
    const portfolio = await portfolioRepository.findById(portfolioId);
    
    if (!portfolio || portfolio.USERS_ID !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get holdings
    const holdings = await holdingRepository.findByPortfolio(portfolioId);
    
    // Get latest quotes for all holdings
    const quotes = await Promise.all(
      holdings.map(holding => quoteService.getLatestQuotes([holding.ISIN]))
    );
    
    // Flatten and filter out empty results
    const flatQuotes = quotes
      .map(quoteArr => quoteArr[0])
      .filter(quote => quote !== undefined);
    
    res.status(200).json({ quotes: flatQuotes });
  } catch (error) {
    next(error);
  }
};

export const getHoldingQuotes = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.holdingId;
    const range = req.query.range as QuoteInterval['range'] || '1mo';
    
    // Verify holding ownership
    const holding = await holdingRepository.findById(holdingId);
    
    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }
    
    const portfolio = await portfolioRepository.findById(holding.PORTFOLIOS_ID);
    
    if (!portfolio || portfolio.USERS_ID !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get quote history
    const interval: QuoteInterval = {
      interval: '1d',
      range
    };
    const history = await quoteService.getHistoricalQuotes(holding.ISIN, interval);
    
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
