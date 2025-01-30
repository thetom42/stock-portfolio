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
  private mapDBStockToBFF = (dbStock: DBStock): Stock => ({
    isin: dbStock.isin,
    symbol: dbStock.symbol,
    name: dbStock.name,
    wkn: dbStock.wkn
  });

  // Helper function to create StockDetails with default values
  private createStockDetails = (stock: Stock): StockDetails => ({
    ...stock,
    currentPrice: 0,
    currency: 'USD',
    exchange: 'DEFAULT',
    volume: 0,
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    priceChange: 0,
    priceChangePercentage: 0
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
        id: result.symbol,
        symbol: result.symbol,
        name: result.name,
        exchange: result.exchange,
        currency: 'USD'
      }));
    } catch (error) {
      return [];
    }
  }

  // Get detailed stock information
  async getStockDetails(isin: string): Promise<StockDetails | null> {
    const yahooFinance = getYahooFinanceService();

    const stock = await this.stockRepository.findByIsin(isin);
    if (!stock) {
      return null;
    }

    const baseStock = this.mapDBStockToBFF(stock);

    // Get real-time quote from Yahoo Finance
    try {
      const quote = await yahooFinance.getRealTimeQuote(stock.isin);

      return {
        ...baseStock,
        currentPrice: quote.price,
        currency: quote.currency,
        exchange: quote.exchange,
        volume: quote.volume,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close,
        priceChange: quote.price - (quote.open || quote.price),
        priceChangePercentage: ((quote.price - (quote.open || quote.price)) / (quote.open || quote.price)) * 100
      };
    } catch (error) {
      // If Yahoo Finance data is not available, return stock info with default values
      return this.createStockDetails(baseStock);
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
