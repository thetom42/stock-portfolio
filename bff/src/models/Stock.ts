export interface Stock {
  isin: string;
  symbol: string;
  name: string;
  wkn: string;
}

export interface StockSearchResult {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
}

export interface StockDetails extends Stock {
  currentPrice: number;
  currency?: string;
  exchange?: string;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  priceChange?: number;
  priceChangePercentage?: number;
}
