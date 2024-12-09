import { Decimal } from '@prisma/client/runtime/library';

export interface Transaction {
    transactions_id: string;
    holdings_id: string;
    buy: boolean;
    transaction_time: Date;
    amount: number;
    price: Decimal;
    commission: Decimal;
    broker: string;
}

// Helper type for creating transactions without having to specify Decimal type
export type CreateTransactionInput = Omit<Transaction, 'price' | 'commission'> & {
    price: number | Decimal;
    commission: number | Decimal;
}
