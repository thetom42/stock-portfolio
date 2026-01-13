import { CreateTransactionDTO, Transaction as BFFTransaction, TransactionQueryParams, PaginatedTransactions } from '../models/Transaction';
import { getPrismaClient } from '../utils/database';
import crypto from 'crypto';
import {
    TransactionRepository,
    HoldingRepository
} from '@stock-portfolio/db';
import type { Transaction } from '@stock-portfolio/db/dist/models/Transaction';
import { Decimal } from '@prisma/client/runtime/library';

// Helper function to map DB Transaction to BFF Transaction
const mapDBTransactionToBFF = (dbTransaction: Transaction): BFFTransaction => ({
    id: dbTransaction.transaction_id,
    holdingId: dbTransaction.holding_id,
    buy: dbTransaction.buy,
    transactionTime: dbTransaction.transaction_time,
    amount: dbTransaction.amount,
    price: Number(dbTransaction.price),
    commission: Number(dbTransaction.commission),
    broker: dbTransaction.broker
});

class TransactionService {
    private transactionRepository: TransactionRepository;
    private holdingRepository: HoldingRepository;
    private static instance: TransactionService;

    private constructor() {
        const prisma = getPrismaClient();
        this.transactionRepository = new TransactionRepository(prisma);
        this.holdingRepository = new HoldingRepository(prisma);
    }

    static getInstance(): TransactionService {
        if (!TransactionService.instance) {
            TransactionService.instance = new TransactionService();
        }
        return TransactionService.instance;
    }

    // For testing purposes
    setTransactionRepository(repo: TransactionRepository): void {
        this.transactionRepository = repo;
    }

    setHoldingRepository(repo: HoldingRepository): void {
        this.holdingRepository = repo;
    }

    // Helper function to map array of DB Transactions to BFF Transactions
    private mapDBTransactionsToBFF(dbTransactions: Transaction[]): BFFTransaction[] {
        return dbTransactions.map(mapDBTransactionToBFF);
    }

    // Helper function to filter and sort transactions
    private filterAndSortTransactions(
        transactions: BFFTransaction[],
        params: TransactionQueryParams
    ): BFFTransaction[] {
        let filtered = [...transactions];

        // Apply date filters
        if (params.startDate) {
            const startDate = new Date(params.startDate);
            filtered = filtered.filter(t => t.transactionTime >= startDate);
        }
        if (params.endDate) {
            const endDate = new Date(params.endDate);
            filtered = filtered.filter(t => t.transactionTime <= endDate);
        }

        // Apply type filter
        if (params.type) {
            filtered = filtered.filter(t => t.buy === (params.type === 'BUY'));
        }

        // Apply sorting
        if (params.sort) {
            filtered.sort((a, b) => {
                const order = params.order === 'desc' ? -1 : 1;
                switch (params.sort) {
                    case 'date':
                        return order * (a.transactionTime.getTime() - b.transactionTime.getTime());
                    case 'amount':
                        return order * (a.amount - b.amount);
                    case 'price':
                        return order * (a.price - b.price);
                    default:
                        return 0;
                }
            });
        }

        return filtered;
    }

    // Helper function to paginate transactions
    private paginateTransactions(
        transactions: BFFTransaction[],
        page: number = 1,
        limit: number = 10
    ): PaginatedTransactions {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTransactions = transactions.slice(startIndex, endIndex);
        const total = transactions.length;
        const totalPages = Math.ceil(total / limit);

        return {
            transactions: paginatedTransactions,
            total,
            page,
            limit,
            totalPages
        };
    }

    async createTransaction(
        holdingId: string,
        transactionData: CreateTransactionDTO
    ): Promise<BFFTransaction> {
        // Get holding to calculate new quantity
        const holding = await this.holdingRepository.findById(holdingId);

        if (!holding) {
            throw new Error('Holding not found');
        }

        // Calculate new quantity before creating transaction
        const newQuantity = transactionData.buy
            ? holding.quantity + transactionData.amount
            : holding.quantity - transactionData.amount;

        if (newQuantity < 0) {
            throw new Error('Insufficient holding quantity for sell transaction');
        }

        // Create the transaction
        const transaction = await this.transactionRepository.create({
            transaction_id: crypto.randomUUID(), // Generate UUID
            holding_id: holdingId,
            buy: transactionData.buy,
            transaction_time: new Date(),
            amount: transactionData.amount,
            price: new Decimal(transactionData.price),
            commission: new Decimal(transactionData.commission || 0),
            broker: transactionData.broker || 'SYSTEM'
        });

        // Update holding quantity
        await this.holdingRepository.update(holdingId, { quantity: newQuantity });

        return mapDBTransactionToBFF(transaction);
    }

    async getTransactionById(transactionId: string): Promise<BFFTransaction | null> {
        const transaction = await this.transactionRepository.findById(transactionId);

        if (!transaction) {
            return null;
        }

        return mapDBTransactionToBFF(transaction);
    }

    async getTransactionsByHolding(
        holdingId: string,
        queryParams: TransactionQueryParams = {}
    ): Promise<PaginatedTransactions> {
        // Get transactions
        const transactions = await this.transactionRepository.findByHoldingId(holdingId);
        const bffTransactions = this.mapDBTransactionsToBFF(transactions);

        // Apply filters and sorting
        const filteredTransactions = this.filterAndSortTransactions(bffTransactions, queryParams);

        // Apply pagination
        return this.paginateTransactions(
            filteredTransactions,
            queryParams.page,
            queryParams.limit
        );
    }

    async getTransactionsByPortfolio(
        portfolioId: string,
        queryParams: TransactionQueryParams = {}
    ): Promise<PaginatedTransactions> {
        // Get holdings for the portfolio
        const holdings = await this.holdingRepository.findByPortfolioId(portfolioId);

        // Get transactions for all holdings
        const transactionPromises = holdings.map(holding =>
            this.transactionRepository.findByHoldingId(holding.holding_id)
        );

        const transactionArrays = await Promise.all(transactionPromises);
        const transactions = transactionArrays.flat();
        const bffTransactions = this.mapDBTransactionsToBFF(transactions);

        // Apply filters and sorting
        const filteredTransactions = this.filterAndSortTransactions(bffTransactions, queryParams);

        // Apply pagination
        return this.paginateTransactions(
            filteredTransactions,
            queryParams.page,
            queryParams.limit
        );
    }
}

// Export singleton instance
export const transactionService = TransactionService.getInstance();

// For testing purposes
export const setTransactionRepository = (repo: TransactionRepository) => {
    transactionService.setTransactionRepository(repo);
    return transactionService;
};

export const setHoldingRepository = (repo: HoldingRepository) => {
    transactionService.setHoldingRepository(repo);
    return transactionService;
};
