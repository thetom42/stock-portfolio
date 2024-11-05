export interface Stock {
  id: string;
  symbol: string;
  isin: string;
  name: string;
  description?: string;
  sector?: string;
  industry?: string;
  currency: string;
  exchange: string;
  country: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockSearchResult {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
}

export interface StockCategory {
  id: string;
  name: string;
  description?: string;
}

export interface StockDetails extends Stock {
  currentPrice?: number;
  priceChange?: number;
  priceChangePercentage?: number;
  marketCap?: number;
  volume?: number;
  peRatio?: number;
  dividendYield?: number;
  yearHigh?: number;
  yearLow?: number;
}
