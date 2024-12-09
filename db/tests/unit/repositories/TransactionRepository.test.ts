import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionRepository } from '../../../repositories/TransactionRepository';
import { HoldingRepository } from '../../../repositories/HoldingRepository';
import { PortfolioRepository } from '../../../repositories/PortfolioRepository';
import { StockRepository } from '../../../repositories/StockRepository';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { UserRepository } from '../../../repositories/UserRepository';
import { Transaction, CreateTransactionInput } from '../../../models/Transaction';
import { Holding } from '../../../models/Holding';
import { Portfolio } from '../../../models/Portfolio';
import { Stock } from '../../../models/Stock';
import { Category } from '../../../models/Category';
import { User } from '../../../models/User';
import { getPrismaClient, clearDatabase } from '../../helpers/prisma';

describe('TransactionRepository', () => {
    let transactionRepository: TransactionRepository;
    let holdingRepository: HoldingRepository;
    let portfolioRepository: PortfolioRepository;
    let stockRepository: StockRepository;
    let categoryRepository: CategoryRepository;
    let userRepository: UserRepository;
    let prisma: PrismaClient;
    let testUser: User;
    let testCategory: Category;
    let testStock: Stock;
    let testPortfolio: Portfolio;
    let testHolding: Holding;

    beforeEach(async () => {
        prisma = getPrismaClient();
        transactionRepository = new TransactionRepository(prisma);
        holdingRepository = new HoldingRepository(prisma);
        portfolioRepository = new PortfolioRepository(prisma);
        stockRepository = new StockRepository(prisma);
        categoryRepository = new CategoryRepository(prisma);
        userRepository = new UserRepository(prisma);
        await clearDatabase();

        // Create test user
        testUser = {
            users_id: 'test-user-id',
            name: 'John',
            surname: 'Doe',
            email: 'john.doe@example.com',
            nickname: 'johnd',
            password: 'hashedPassword',
            join_date: new Date('2024-01-01')
        };
        await userRepository.create(testUser);

        // Create test category
        testCategory = {
            categories_id: 'test-category-id',
            name: 'Test Category'
        };
        await categoryRepository.create(testCategory);

        // Create test stock
        testStock = {
            isin: 'TEST123456789',
            categories_id: testCategory.categories_id,
            name: 'Test Stock',
            wkn: 'TEST123',
            symbol: 'TST'
        };
        await stockRepository.create(testStock);

        // Create test portfolio
        testPortfolio = {
            portfolios_id: 'test-portfolio-id',
            name: 'Test Portfolio',
            created_at: new Date(),
            users_id: testUser.users_id
        };
        await portfolioRepository.create(testPortfolio);

        // Create test holding
        testHolding = {
            holdings_id: 'test-holding-id',
            portfolios_id: testPortfolio.portfolios_id,
            isin: testStock.isin,
            quantity: 100,
            start_date: new Date('2024-01-01'),
            end_date: null
        };
        await holdingRepository.create(testHolding);
    });

    describe('create', () => {
        it('should create a new transaction', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transactions_id: 'test-transaction-id',
                holdings_id: testHolding.holdings_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };

            // Act
            const result = await transactionRepository.create(transactionData);

            // Assert
            expect(result).toBeDefined();
            expect(result.transactions_id).toBe(transactionData.transactions_id);
            expect(result.amount).toBe(transactionData.amount);
            expect(result.price).toEqual(new Decimal(transactionData.price));
            expect(result.commission).toEqual(new Decimal(transactionData.commission));

            // Verify the transaction was actually saved
            const savedTransaction = await prisma.transaction.findUnique({
                where: { transactions_id: transactionData.transactions_id }
            });
            expect(savedTransaction).toBeDefined();
            expect(savedTransaction?.amount).toBe(transactionData.amount);
        });

        it('should throw an error if holding does not exist', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transactions_id: 'test-transaction-id',
                holdings_id: 'non-existent-holding',
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Holding not found');
        });

        it('should throw an error if amount is not positive', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transactions_id: 'test-transaction-id',
                holdings_id: testHolding.holdings_id,
                buy: true,
                transaction_time: new Date(),
                amount: 0,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Amount must be positive');
        });

        it('should throw an error if price is not positive', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transactions_id: 'test-transaction-id',
                holdings_id: testHolding.holdings_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 0,
                commission: 1.50,
                broker: 'Test Broker'
            };

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Price must be positive');
        });

        it('should throw an error if commission is negative', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transactions_id: 'test-transaction-id',
                holdings_id: testHolding.holdings_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: -1.50,
                broker: 'Test Broker'
            };

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Commission cannot be negative');
        });
    });

    describe('findById', () => {
        it('should find a transaction by ID', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transactions_id: 'test-transaction-id',
                holdings_id: testHolding.holdings_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act
            const result = await transactionRepository.findById(transactionData.transactions_id);

            // Assert
            expect(result).toBeDefined();
            expect(result?.transactions_id).toBe(transactionData.transactions_id);
            expect(result?.amount).toBe(transactionData.amount);
        });

        it('should return null if transaction is not found', async () => {
            // Act
            const result = await transactionRepository.findById('non-existent-id');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findByHoldingId', () => {
        it('should find all transactions for a holding', async () => {
            // Arrange
            const transactions: CreateTransactionInput[] = [
                {
                    transactions_id: 'transaction-1',
                    holdings_id: testHolding.holdings_id,
                    buy: true,
                    transaction_time: new Date('2024-01-01T10:00:00Z'),
                    amount: 50,
                    price: 100.50,
                    commission: 1.50,
                    broker: 'Test Broker'
                },
                {
                    transactions_id: 'transaction-2',
                    holdings_id: testHolding.holdings_id,
                    buy: false,
                    transaction_time: new Date('2024-01-01T11:00:00Z'),
                    amount: 25,
                    price: 110.50,
                    commission: 1.50,
                    broker: 'Test Broker'
                }
            ];
            await Promise.all(transactions.map(t => transactionRepository.create(t)));

            // Act
            const result = await transactionRepository.findByHoldingId(testHolding.holdings_id);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].transaction_time.getTime()).toBeGreaterThan(
                result[1].transaction_time.getTime()
            ); // Check descending order
        });

        it('should return empty array when holding has no transactions', async () => {
            // Act
            const result = await transactionRepository.findByHoldingId(testHolding.holdings_id);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update a transaction', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transactions_id: 'test-transaction-id',
                holdings_id: testHolding.holdings_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            const updateData = {
                amount: 75,
                price: 110.50
            };

            // Act
            const result = await transactionRepository.update(transactionData.transactions_id, updateData);

            // Assert
            expect(result).toBeDefined();
            expect(result.amount).toBe(updateData.amount);
            expect(result.price).toEqual(new Decimal(updateData.price));

            // Verify the update was persisted
            const updatedTransaction = await prisma.transaction.findUnique({
                where: { transactions_id: transactionData.transactions_id }
            });
            expect(updatedTransaction?.amount).toBe(updateData.amount);
            expect(updatedTransaction?.price).toEqual(new Decimal(updateData.price));
        });

        it('should throw an error if transaction does not exist', async () => {
            // Act & Assert
            await expect(transactionRepository.update('non-existent-id', { amount: 75 }))
                .rejects
                .toThrow('Transaction not found');
        });
    });

    describe('delete', () => {
        it('should delete a transaction', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transactions_id: 'test-transaction-id',
                holdings_id: testHolding.holdings_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act
            const result = await transactionRepository.delete(transactionData.transactions_id);

            // Assert
            expect(result).toBeDefined();
            expect(result.transactions_id).toBe(transactionData.transactions_id);

            // Verify the transaction was actually deleted
            const deletedTransaction = await prisma.transaction.findUnique({
                where: { transactions_id: transactionData.transactions_id }
            });
            expect(deletedTransaction).toBeNull();
        });

        it('should throw an error if transaction does not exist', async () => {
            // Act & Assert
            await expect(transactionRepository.delete('non-existent-id'))
                .rejects
                .toThrow('Transaction not found');
        });
    });
});
