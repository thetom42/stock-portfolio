import { Stock, StockDetails, StockSearchResult } from '../models/Stock';
import { getPrismaClient } from '../utils/database';
import { getYahooFinanceService, YahooFinanceSearchResult } from './yahooFinanceService';
import { StockRepository } from '@stock-portfolio/db';
import type { Stock as DBStock } from '@stock-portfolio/db/dist/models/Stock';

export class StockService {
  private stockRepository: StockRepository;

  constructor(stockRepo?: StockRepository) {
    this.stockRepository = stockRepo || new StockRepository(getPrismaClient());
  }

  // Helper function to map DB Stock to BFF Stock
  private mapDBStockToBFF = (dbStock: DBStock, yahooQuote?: any): Stock => ({
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
  async getStockByIsin(isin: string): Promise<Stock | null> {
    const stock = await this.stockRepository.findByIsin(isin);
    return stock ? this.mapDBStockToBFF(stock) : null;
  }

  // Get stock by Symbol
  async getStockBySymbol(symbol: string): Promise<Stock | null> {
    const stock = await this.stockRepository.findBySymbol(symbol);
    return stock ? this.mapDBStockToBFF(stock) : null;
  }

  // Get stock by WKN
  async getStockByWkn(wkn: string): Promise<Stock | null> {
    const stock = await this.stockRepository.findByWkn(wkn);
    return stock ? this.mapDBStockToBFF(stock) : null;
  }

  // Get all stocks
  async getAllStocks(): Promise<Stock[]> {
    const stocks = await this.stockRepository.findAll();
    return stocks.map(stock => this.mapDBStockToBFF(stock));
  }

  // Get stocks by category
  async getStocksByCategory(categoryId: string): Promise<Stock[]> {
    const stocks = await this.stockRepository.findByCategory(categoryId);
    return stocks.map(stock => this.mapDBStockToBFF(stock));
  }

  // Search stocks using Yahoo Finance
  async searchStocks(query: string): Promise<StockSearchResult[]> {
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
  }

  // Get detailed stock information
  async getStockDetails(isin: string): Promise<StockDetails | null> {
    const yahooFinance = getYahooFinanceService();

    const stock = await this.stockRepository.findByIsin(isin);
    if (!stock) {
      return null;
    }

    // Get real-time quote from Yahoo Finance
    try {
      const quote = await yahooFinance.getRealTimeQuote(stock.isin);
      const stockWithYahooData = this.mapDBStockToBFF(stock, quote);

      return {
        ...stockWithYahooData,
        currentPrice: quote.price,
        priceChange: quote.price - (quote.open || quote.price), // Fallback to current price if open is not available
        priceChangePercentage: ((quote.price - (quote.open || quote.price)) / (quote.open || quote.price)) * 100,
        volume: quote.volume
      };
    } catch (error) {
      // If Yahoo Finance data is not available, return basic stock info
      return this.mapDBStockToBFF(stock);
    }
  }

  // Create a new stock
  async createStock(
    categoryId: string,
    stockData: { isin: string; name: string; wkn: string; symbol: string }
  ): Promise<Stock> {
    const dbStock = await this.stockRepository.create({
      isin: stockData.isin,
      category_id: categoryId,
      name: stockData.name,
      wkn: stockData.wkn,
      symbol: stockData.symbol
    });

    return this.mapDBStockToBFF(dbStock);
  }

  // Update a stock
  async updateStock(
    isin: string,
    updateData: Partial<{ name: string; wkn: string; symbol: string; categoryId: string }>
  ): Promise<Stock | null> {
    const dbStock = await this.stockRepository.update(isin, {
      ...(updateData.name && { name: updateData.name }),
      ...(updateData.wkn && { wkn: updateData.wkn }),
      ...(updateData.symbol && { symbol: updateData.symbol }),
      ...(updateData.categoryId && { category_id: updateData.categoryId })
    });

    return dbStock ? this.mapDBStockToBFF(dbStock) : null;
  }

  // Delete a stock
  async deleteStock(isin: string): Promise<void> {
    await this.stockRepository.delete(isin);
  }
}

// Export a singleton instance
export const stockService = new StockService();

// For testing: allow repository injection
export const setStockRepository = (repo: StockRepository) => {
  return new StockService(repo);
};
