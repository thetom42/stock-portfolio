// Base interface matching DB model
export interface Quote {
  id: string;
  isin: string;  // Changed from stockId to match DB and other models
  price: number;
  currency: string;
  timestamp: Date;  // Renamed from market_time for BFF consistency
  exchange: string;
}

// Historical quote data from Yahoo Finance
export interface HistoricalQuote {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;
  volume: number;
}

// Parameters for fetching historical data
export interface QuoteInterval {
  interval: '1d' | '1wk' | '1mo' | '3mo';
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | 'max';
}

// Real-time quote with price change calculations
export interface RealTimeQuote {
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

// Historical data response
export interface QuoteHistory {
  symbol: string;
  interval: string;
  quotes: HistoricalQuote[];
}
