import { Decimal } from '@prisma/client/runtime/library';

export interface Transaction {
    TRANSACTIONS_ID: string;
    HOLDINGS_ID: string;
    BUY: boolean;
    TRANSACTION_TIME: Date;
    AMOUNT: number;
    PRICE: Decimal;
    COMMISSION: Decimal;
    BROKER: string;
}

// Helper type for creating transactions without having to specify Decimal type
export type CreateTransactionInput = Omit<Transaction, 'PRICE' | 'COMMISSION'> & {
    PRICE: number | Decimal;
    COMMISSION: number | Decimal;
};
