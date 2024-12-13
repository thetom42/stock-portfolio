import { PrismaClient } from '@prisma/client';
import { Transaction, CreateTransactionInput } from '../models/Transaction';
export declare class TransactionRepository {
    private prisma;
    constructor(prisma: PrismaClient);
    create(transaction: CreateTransactionInput): Promise<Transaction>;
    findById(id: string): Promise<Transaction | null>;
    findByHoldingId(holdingId: string): Promise<Transaction[]>;
    update(id: string, transactionData: Partial<CreateTransactionInput>): Promise<Transaction>;
    delete(id: string): Promise<Transaction>;
}
