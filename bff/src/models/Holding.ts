import { Transaction } from './Transaction';

// Base interface matching DB model
export interface Holding {
    HOLDINGS_ID: string;
    PORTFOLIOS_ID: string;
    ISIN: string;
    QUANTITY: number;
    START_DATE: Date;
    END_DATE: Date | null;
}

// DTOs for API requests
export interface CreateHoldingDTO {
    PORTFOLIOS_ID: string;
    ISIN: string;
    QUANTITY: number;
    PRICE: number;
}

export interface UpdateHoldingDTO {
    QUANTITY?: number;
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
    quantity: number;
    costBasis: number;
    averageCost: number;
    currentValue: number;
    unrealizedGainLoss: number;
}

export interface HoldingHistory {
    date: Date;
    buy: boolean;
    amount: number;
    price: number;
    value: number;
    commission?: number;
    broker?: string;
}
