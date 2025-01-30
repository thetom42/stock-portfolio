// Base interface matching DB model
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
}

// DTOs for API requests
export interface CreatePortfolioDTO {
  name: string;
}

export interface UpdatePortfolioDTO {
  name?: string;
}

// Summary with calculated values
export interface PortfolioSummary {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  numberOfHoldings: number;
  topPerformers: Array<{
    symbol: string;
    gainLossPercentage: number;
  }>;
}

// Portfolio with its holdings
export interface PortfolioDetails extends Portfolio {
  holdings: PortfolioHolding[];
}

// Holding within a portfolio context
export interface PortfolioHolding {
  id: string;
  isin: string;  // Changed from stockId to isin to match Stock model
  quantity: number;
  averageCost: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
}

// Performance tracking
export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface PerformanceData {
  daily: TimeSeriesData[];
  weekly: TimeSeriesData[];
  monthly: TimeSeriesData[];
}

// Asset allocation
export interface SectorAllocation {
  sector: string;
  percentage: number;
}

export interface AssetTypeAllocation {
  type: string;
  percentage: number;
}

export interface AllocationData {
  bySector: SectorAllocation[];
  byAssetType: AssetTypeAllocation[];
}

// Return calculations
export interface PeriodReturns {
  '1d': number;
  '1w': number;
  '1m': number;
  '3m': number;
  '6m': number;
  '1y': number;
  ytd: number;
}

export interface ReturnsData {
  totalReturn: number;
  totalReturnPercentage: number;
  annualizedReturn: number;
  periodReturns: PeriodReturns;
}

// Historical data
export interface Transaction {
  date: string;
  type: string;
  symbol: string;
  quantity: number;
  price: number;
}

export interface ValueHistory {
  date: string;
  value: number;
}

export interface HistoryData {
  transactions: Transaction[];
  valueHistory: ValueHistory[];
}

// Response types
export interface PortfolioResponse { portfolio: Portfolio }
export interface PortfoliosResponse { portfolios: Portfolio[] }
export interface SummaryResponse { summary: PortfolioSummary }
export interface PerformanceResponse { performance: PerformanceData }
export interface HoldingsResponse { holdings: PortfolioHolding[] }
export interface AllocationResponse { allocation: AllocationData }
export interface ReturnsResponse { returns: ReturnsData }
export interface HistoryResponse { history: HistoryData }
export interface ErrorResponse { error: string }
