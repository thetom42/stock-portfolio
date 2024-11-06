// Base interfaces matching DB models
export interface Holding {
    HOLDINGS_ID: string;
    PORTFOLIOS_ID: string;
    ISIN: string;
    QUANTITY: number;
    START_DATE: Date;
    END_DATE: Date | null;
}

export interface Transaction {
    TRANSACTIONS_ID: string;
    HOLDINGS_ID: string;
    BUY: boolean;
    TRANSACTION_TIME: Date;
    AMOUNT: number;
    PRICE: number;
    COMMISSION: number;
    BROKER: string;
}

// DTOs for API requests
export interface CreateHoldingDTO {
    PORTFOLIOS_ID: string;
    ISIN: string;
    QUANTITY: number;
    PRICE: number;
}

export interface CreateTransactionDTO {
    AMOUNT: number;
    PRICE: number;
    BUY: boolean;
    COMMISSION?: number;
    BROKER?: string;
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
