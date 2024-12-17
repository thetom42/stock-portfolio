import { Transaction } from './Transaction';

// Base interface matching DB model
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

// Extended interfaces for API responses
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

export interface HoldingPerformance {
    totalInvested: number;
    currentValue: number;
    totalReturn: number;
    totalReturnPercentage: number;
    transactions: Transaction[];
}

export interface HoldingValue {
    currentValue: number;
    costBasis: number;
    unrealizedGainLoss: number;
    unrealizedGainLossPercentage: number;
}

export interface HoldingHistory {
    date: Date;
    price: number;
    value: number;
}
