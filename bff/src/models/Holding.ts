export interface Holding {
  id: string;
  portfolioId: string;
  stockId: string;
  quantity: number;
  averageCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHoldingDTO {
  stockId: string;
  quantity: number;
  purchasePrice: number;
}

export interface UpdateHoldingDTO {
  quantity?: number;
}

export interface HoldingDetails extends Holding {
  stock: {
    symbol: string;
    name: string;
    currency: string;
  };
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercentage: number;
}

export interface Transaction {
  id: string;
  holdingId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
  fees?: number;
  notes?: string;
}

export interface CreateTransactionDTO {
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fees?: number;
  notes?: string;
}

export interface HoldingPerformance {
  totalReturn: number;
  totalReturnPercentage: number;
  transactions: Transaction[];
  priceHistory: {
    date: Date;
    price: number;
    value: number;
  }[];
}
