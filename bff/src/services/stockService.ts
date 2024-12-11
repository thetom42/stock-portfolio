import { Stock, StockDetails, StockSearchResult } from '../models/Stock';
import { getPrismaClient } from '../utils/database';
import { getYahooFinanceService, YahooFinanceSearchResult } from './yahooFinanceService';
import { StockRepository } from '../../../db/repositories/StockRepository';

// Initialize repository with default implementation
const prisma = getPrismaClient();
let stockRepository = new StockRepository(prisma);

// For testing: allow repository injection
export const setStockRepository = (repo: any) => {
  stockRepository = repo;
};

// Helper function to map DB Stock to BFF Stock
const mapDBStockToBFF = (dbStock: any, yahooQuote?: any): Stock => ({
  id: dbStock.isin,
  symbol: dbStock.symbol,
  isin: dbStock.isin,
  name: dbStock.name,
  currency: yahooQuote?.currency || 'USD', // Use Yahoo data if available
  exchange: yahooQuote?.exchange || 'DEFAULT', // Use Yahoo data if available
  country: 'US', // Default since DB doesn't store this
  createdAt: new Date(), // Default since DB doesn't store this
  updatedAt: new Date() // Default since DB doesn't store this
});

// Get stock by ISIN
export const getStockByISIN = async (isin: string): Promise<Stock | null> => {
  const stock = await stockRepository.findByIsin(isin);
  
  if (!stock) {
    return null;
  }

  return mapDBStockToBFF(stock);
};

// Get stock by Symbol
export const getStockBySymbol = async (symbol: string): Promise<Stock | null> => {
  const stock = await stockRepository.findBySymbol(symbol);
  
  if (!stock) {
    return null;
  }

  return mapDBStockToBFF(stock);
};

// Get stock by WKN
export const getStockByWKN = async (wkn: string): Promise<Stock | null> => {
  const stock = await stockRepository.findByWkn(wkn);
  
  if (!stock) {
    return null;
  }

  return mapDBStockToBFF(stock);
};

// Get all stocks
export const getAllStocks = async (): Promise<Stock[]> => {
  const stocks = await stockRepository.findAll();
  return stocks.map(stock => mapDBStockToBFF(stock));
};

// Get stocks by category
export const getStocksByCategory = async (categoryId: string): Promise<Stock[]> => {
  const stocks = await stockRepository.findByCategory(categoryId);
  return stocks.map(stock => mapDBStockToBFF(stock));
};

// Search stocks using Yahoo Finance
export const searchStocks = async (query: string): Promise<StockSearchResult[]> => {
  try {
    const yahooFinance = getYahooFinanceService();
    const results = await yahooFinance.searchStocks(query);
    
    return results.map((result: YahooFinanceSearchResult) => ({
      id: result.symbol, // Using symbol as ID since we don't have ISIN yet
      symbol: result.symbol,
      name: result.name,
      exchange: result.exchange,
      currency: 'USD' // Default since Yahoo Finance API doesn't always provide currency
    }));
  } catch (error) {
    return []; // Return empty array on error
  }
};

// Get detailed stock information
export const getStockDetails = async (isin: string): Promise<StockDetails | null> => {
  const yahooFinance = getYahooFinanceService();

  const stock = await stockRepository.findByIsin(isin);
  if (!stock) {
    return null;
  }

  // Get real-time quote from Yahoo Finance
  try {
    const quote = await yahooFinance.getRealTimeQuote(stock.isin);
    const stockWithYahooData = mapDBStockToBFF(stock, quote);
    
    return {
      ...stockWithYahooData,
      currentPrice: quote.price,
      priceChange: quote.price - (quote.open || quote.price), // Fallback to current price if open is not available
      priceChangePercentage: ((quote.price - (quote.open || quote.price)) / (quote.open || quote.price)) * 100,
      volume: quote.volume
    };
  } catch (error) {
    // If Yahoo Finance data is not available, return basic stock info
    return mapDBStockToBFF(stock);
  }
};

// Create a new stock
export const createStock = async (
  categoryId: string,
  stockData: { isin: string; name: string; wkn: string; symbol: string }
): Promise<Stock> => {
  const dbStock = await stockRepository.create({
    isin: stockData.isin,
    category_id: categoryId,
    name: stockData.name,
    wkn: stockData.wkn,
    symbol: stockData.symbol
  });

  return mapDBStockToBFF(dbStock);
};

// Update a stock
export const updateStock = async (
  isin: string,
  updateData: Partial<{ name: string; wkn: string; symbol: string; categoryId: string }>
): Promise<Stock | null> => {
  const dbStock = await stockRepository.update(isin, {
    ...(updateData.name && { name: updateData.name }),
    ...(updateData.wkn && { wkn: updateData.wkn }),
    ...(updateData.symbol && { symbol: updateData.symbol }),
    ...(updateData.categoryId && { category_id: updateData.categoryId })
  });

  return dbStock ? mapDBStockToBFF(dbStock) : null;
};

// Delete a stock
export const deleteStock = async (isin: string): Promise<void> => {
  await stockRepository.delete(isin);
};
