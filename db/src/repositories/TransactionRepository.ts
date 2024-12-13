import { PrismaClient } from '@prisma/client';
import { Transaction, CreateTransactionInput } from '../models/Transaction';

export class TransactionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(transaction: CreateTransactionInput): Promise<Transaction> {
    try {
      // Validate amount
      if (transaction.amount <= 0) {
        throw new Error('Amount must be positive');
      }

      // Validate price
      const price = typeof transaction.price === 'string' ? parseFloat(transaction.price) : Number(transaction.price);
      if (price <= 0) {
        throw new Error('Price must be positive');
      }

      // Validate commission
      const commission = typeof transaction.commission === 'string' ? parseFloat(transaction.commission) : Number(transaction.commission);
      if (commission < 0) {
        throw new Error('Commission cannot be negative');
      }

      return await this.prisma.transaction.create({
        data: transaction
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('foreign key')) {
          throw new Error('Holding not found');
        }
        if (error.message.includes('Unique constraint')) {
          throw new Error('Transaction already exists');
        }
        throw error;
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    return await this.prisma.transaction.findUnique({
      where: { transaction_id: id }
    });
  }

  async findByHoldingId(holdingId: string): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: { holding_id: holdingId },
      orderBy: {
        transaction_time: 'desc'
      }
    });
  }

  async update(id: string, transactionData: Partial<CreateTransactionInput>): Promise<Transaction> {
    try {
      const existingTransaction = await this.findById(id);
      if (!existingTransaction) {
        throw new Error('Transaction not found');
      }

      // Validate amount if provided
      if (transactionData.amount !== undefined && transactionData.amount <= 0) {
        throw new Error('Amount must be positive');
      }

      // Validate price if provided
      if (transactionData.price !== undefined) {
        const price = typeof transactionData.price === 'string' ? parseFloat(transactionData.price) : Number(transactionData.price);
        if (price <= 0) {
          throw new Error('Price must be positive');
        }
      }

      // Validate commission if provided
      if (transactionData.commission !== undefined) {
        const commission = typeof transactionData.commission === 'string' ? parseFloat(transactionData.commission) : Number(transactionData.commission);
        if (commission < 0) {
          throw new Error('Commission cannot be negative');
        }
      }

      return await this.prisma.transaction.update({
        where: { transaction_id: id },
        data: transactionData
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Record to update not found')) {
          throw new Error('Transaction not found');
        }
        if (error.message.includes('foreign key')) {
          throw new Error('Holding not found');
        }
        throw error;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Transaction> {
    try {
      return await this.prisma.transaction.delete({
        where: { transaction_id: id }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new Error('Transaction not found');
      }
      throw error;
    }
  }
}
