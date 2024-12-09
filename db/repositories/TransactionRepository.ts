import { PrismaClient } from '@prisma/client';
import { Transaction, CreateTransactionInput } from '../models/Transaction';

export class TransactionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(transaction: CreateTransactionInput): Promise<Transaction> {
    try {
      return await this.prisma.transaction.create({
        data: transaction
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new Error('Transaction already exists');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    return await this.prisma.transaction.findUnique({
      where: { transactions_id: id }
    });
  }

  async findByHoldingId(holdingId: string): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: { holdings_id: holdingId }
    });
  }

  async update(id: string, transactionData: Partial<CreateTransactionInput>): Promise<Transaction> {
    try {
      const existingTransaction = await this.findById(id);
      if (!existingTransaction) {
        throw new Error('Transaction not found');
      }

      return await this.prisma.transaction.update({
        where: { transactions_id: id },
        data: transactionData
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new Error('Transaction not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Transaction> {
    try {
      return await this.prisma.transaction.delete({
        where: { transactions_id: id }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new Error('Transaction not found');
      }
      throw error;
    }
  }
}
