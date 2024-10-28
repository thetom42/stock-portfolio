import { PrismaClient } from '@prisma/client';
import { Transaction, CreateTransactionInput } from '../models/Transaction';
import { Decimal } from '@prisma/client/runtime/library';

export class TransactionRepository {
    constructor(private prisma: PrismaClient) {}

    private async validateTransaction(transaction: Partial<CreateTransactionInput>): Promise<void> {
        // Validate holding exists if provided
        if (transaction.HOLDINGS_ID) {
            const holding = await this.prisma.holding.findUnique({
                where: { HOLDINGS_ID: transaction.HOLDINGS_ID }
            });
            if (!holding) {
                throw new Error('Holding not found');
            }
        }

        // Validate amount if provided
        if (transaction.AMOUNT !== undefined && transaction.AMOUNT <= 0) {
            throw new Error('Amount must be positive');
        }

        // Validate price if provided
        if (transaction.PRICE !== undefined) {
            const price = transaction.PRICE instanceof Decimal ? 
                transaction.PRICE : new Decimal(transaction.PRICE);
            if (price.lessThanOrEqualTo(0)) {
                throw new Error('Price must be positive');
            }
        }

        // Validate commission if provided
        if (transaction.COMMISSION !== undefined) {
            const commission = transaction.COMMISSION instanceof Decimal ? 
                transaction.COMMISSION : new Decimal(transaction.COMMISSION);
            if (commission.lessThan(0)) {
                throw new Error('Commission cannot be negative');
            }
        }
    }

    async create(transaction: CreateTransactionInput): Promise<Transaction> {
        await this.validateTransaction(transaction);

        const data = {
            ...transaction,
            PRICE: transaction.PRICE instanceof Decimal ? 
                transaction.PRICE : new Decimal(transaction.PRICE),
            COMMISSION: transaction.COMMISSION instanceof Decimal ? 
                transaction.COMMISSION : new Decimal(transaction.COMMISSION)
        };

        return this.prisma.transaction.create({
            data
        });
    }

    async findById(id: string): Promise<Transaction | null> {
        return this.prisma.transaction.findUnique({
            where: { TRANSACTIONS_ID: id }
        });
    }

    async findByHolding(holdingId: string): Promise<Transaction[]> {
        return this.prisma.transaction.findMany({
            where: { HOLDINGS_ID: holdingId },
            orderBy: { TRANSACTION_TIME: 'desc' }
        });
    }

    async findByHoldingAndType(holdingId: string, isBuy: boolean): Promise<Transaction[]> {
        return this.prisma.transaction.findMany({
            where: { 
                HOLDINGS_ID: holdingId,
                BUY: isBuy
            },
            orderBy: { TRANSACTION_TIME: 'desc' }
        });
    }

    async findByTimeRange(
        startTime: Date,
        endTime: Date
    ): Promise<Transaction[]> {
        return this.prisma.transaction.findMany({
            where: {
                TRANSACTION_TIME: {
                    gte: startTime,
                    lte: endTime
                }
            },
            orderBy: { TRANSACTION_TIME: 'desc' }
        });
    }

    async findByHoldingAndTimeRange(
        holdingId: string,
        startTime: Date,
        endTime: Date
    ): Promise<Transaction[]> {
        return this.prisma.transaction.findMany({
            where: {
                HOLDINGS_ID: holdingId,
                TRANSACTION_TIME: {
                    gte: startTime,
                    lte: endTime
                }
            },
            orderBy: { TRANSACTION_TIME: 'desc' }
        });
    }

    async update(id: string, data: Partial<CreateTransactionInput>): Promise<Transaction> {
        const transaction = await this.findById(id);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        await this.validateTransaction(data);

        const updateData = {
            ...data,
            PRICE: data.PRICE instanceof Decimal ? data.PRICE :
                   data.PRICE !== undefined ? new Decimal(data.PRICE) : undefined,
            COMMISSION: data.COMMISSION instanceof Decimal ? data.COMMISSION :
                       data.COMMISSION !== undefined ? new Decimal(data.COMMISSION) : undefined
        };

        return this.prisma.transaction.update({
            where: { TRANSACTIONS_ID: id },
            data: updateData
        });
    }

    async delete(id: string): Promise<Transaction> {
        const transaction = await this.findById(id);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        return this.prisma.transaction.delete({
            where: { TRANSACTIONS_ID: id }
        });
    }

    async deleteByHolding(holdingId: string): Promise<number> {
        const result = await this.prisma.transaction.deleteMany({
            where: { HOLDINGS_ID: holdingId }
        });
        return result.count;
    }

    async getTotalAmount(holdingId: string): Promise<number> {
        const transactions = await this.findByHolding(holdingId);
        return transactions.reduce((total, t) => 
            total + (t.BUY ? t.AMOUNT : -t.AMOUNT), 0);
    }

    async getTotalValue(holdingId: string): Promise<Decimal> {
        const transactions = await this.findByHolding(holdingId);
        return transactions.reduce((total, t) => {
            const transactionValue = t.PRICE.mul(t.AMOUNT);
            return t.BUY ? total.add(transactionValue) : total.sub(transactionValue);
        }, new Decimal(0));
    }

    async getTotalCommission(holdingId: string): Promise<Decimal> {
        const transactions = await this.findByHolding(holdingId);
        return transactions.reduce((total, t) => 
            total.add(t.COMMISSION), new Decimal(0));
    }
}
