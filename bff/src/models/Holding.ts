import { Transaction } from './Transaction';

// Base interface
export interface Holding {
    id: string;
    portfolioId: string;
    isin: string;
    quantity: number;
    startDate: Date;
    endDate: Date | null;
}

// DTOs for API requests
export interface CreateHoldingDTO {
    portfolioId: string;
    isin: string;
    quantity: number;
    price: number;
}

export interface UpdateHoldingDTO {
    quantity?: number;
}

// Extended interface with real-time data
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

// Performance data calculated at runtime
export interface HoldingPerformance {
    totalReturn: number;
    percentageReturn: number;
    annualizedReturn: number;
    holdingPeriod: number;
}

// Value data calculated at runtime
export interface HoldingValue {
    currentValue: number;
    costBasis: number;
    unrealizedGainLoss: number;
    unrealizedGainLossPercentage: number;
}

// Historical data from quote service
export interface HoldingHistory {
    date: Date;
    price: number;
    value: number;
}
