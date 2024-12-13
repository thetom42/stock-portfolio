import { Decimal } from '@prisma/client/runtime/library';
export interface Transaction {
    transaction_id: string;
    holding_id: string;
    buy: boolean;
    transaction_time: Date;
    amount: number;
    price: Decimal;
    commission: Decimal;
    broker: string;
}
export type CreateTransactionInput = Omit<Transaction, 'price' | 'commission'> & {
    price: number | Decimal;
    commission: number | Decimal;
};
