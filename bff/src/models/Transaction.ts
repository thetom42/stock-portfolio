// Base interface matching DB model with BFF naming conventions
export interface Transaction {
    id: string;
    holdingId: string;
    buy: boolean;
    transactionTime: Date;
    amount: number;
    price: number;        // Decimal in DB, number in BFF
    commission: number;   // Decimal in DB, number in BFF
    broker: string;
}

// DTO for API requests with optional fields that have defaults
export interface CreateTransactionDTO {
    amount: number;
    price: number;
    buy: boolean;
    commission?: number;  // Defaults to 0
    broker?: string;     // Defaults to 'SYSTEM'
}

// Query parameters for filtering and sorting
export interface TransactionQueryParams {
    startDate?: string;
    endDate?: string;
    type?: 'BUY' | 'SELL';
    sort?: 'date' | 'amount' | 'price';
    order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

// Paginated response interface
export interface PaginatedTransactions {
    transactions: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
