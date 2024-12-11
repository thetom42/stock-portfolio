// Base interface matching DB model
export interface Transaction {
    id: string;
    holding_id: string;
    buy: boolean;
    transaction_time: Date;
    amount: number;
    price: number;
    commission: number;
    broker: string;
}

// DTO for API requests
export interface CreateTransactionDTO {
    amount: number;
    price: number;
    buy: boolean;
    commission?: number;
    broker?: string;
}

// Query parameters for transaction filtering
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
