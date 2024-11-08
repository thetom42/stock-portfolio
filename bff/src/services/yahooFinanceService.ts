import axios from 'axios';
import { environment } from '../config/environment';

interface YahooFinanceQuote {
  price: number;
  currency: string;
  exchange: string;
  volume?: number;
  timestamp: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

interface HistoricalQuote {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

interface QuoteOptions {
  interval: string;
  range: string;
}

interface YahooFinanceSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

class YahooFinanceService {
  private readonly apiKey: string;
  private readonly apiHost: string;
  private readonly baseURL: string = 'https://yh-finance.p.rapidapi.com';

  constructor() {
    this.apiKey = environment.YAHOO_FINANCE_API_KEY;
    this.apiHost = environment.YAHOO_FINANCE_API_HOST;
    
    if (!this.apiKey) {
      throw new Error('Yahoo Finance API key is not configured');
    }
  }

  private async makeRequest(endpoint: string, params: any = {}) {
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params,
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': this.apiHost
        }
      });
      return response.data;
    } catch (error) {
      console.error('Yahoo Finance API error:', error);
      throw new Error('Failed to fetch data from Yahoo Finance');
    }
  }

  async getRealTimeQuote(isin: string): Promise<YahooFinanceQuote> {
    const data = await this.makeRequest('/stock/v2/get-quote', {
      symbol: isin
    });

    return {
      price: data.price.regularMarketPrice.raw,
      currency: data.price.currency,
      exchange: data.price.exchange,
      volume: data.price.regularMarketVolume?.raw,
      timestamp: data.price.regularMarketTime
    };
  }

  async getHistoricalQuotes(
    isin: string,
    options: QuoteOptions
  ): Promise<HistoricalQuote[]> {
    const data = await this.makeRequest('/stock/v3/get-historical-data', {
      symbol: isin,
      interval: options.interval,
      range: options.range
    });

    return data.prices.map((price: any) => ({
      date: new Date(price.date * 1000),
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      volume: price.volume,
      adjClose: price.adjClose
    }));
  }

  async getIntradayQuotes(isin: string): Promise<YahooFinanceQuote[]> {
    const data = await this.makeRequest('/stock/v2/get-chart', {
      symbol: isin,
      interval: '5m',
      range: '1d'
    });

    return data.chart.result[0].indicators.quote[0].map((quote: any, index: number) => ({
      price: quote.close,
      timestamp: data.chart.result[0].timestamp[index] * 1000,
      volume: quote.volume,
      open: quote.open,
      high: quote.high,
      low: quote.low,
      close: quote.close
    }));
  }

  async searchStocks(query: string): Promise<YahooFinanceSearchResult[]> {
    const data = await this.makeRequest('/stock/v1/search', {
      q: query
    });

    return data.quotes.map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.longname || quote.shortname,
      exchange: quote.exchange,
      type: quote.quoteType
    }));
  }
}

// Singleton instance
let yahooFinanceService: YahooFinanceService | null = null;

export function getYahooFinanceService(): YahooFinanceService {
  if (!yahooFinanceService) {
    yahooFinanceService = new YahooFinanceService();
  }
  return yahooFinanceService;
}

export type { YahooFinanceQuote, HistoricalQuote, QuoteOptions, YahooFinanceSearchResult };
