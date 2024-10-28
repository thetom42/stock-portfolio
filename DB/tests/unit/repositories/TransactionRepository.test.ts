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
            USERS_ID: 'test-user-id',
            NAME: 'John',
            SURNAME: 'Doe',
            EMAIL: 'john.doe@example.com',
            NICKNAME: 'johnd',
            PASSWORD: 'hashedPassword',
            JOIN_DATE: new Date('2024-01-01')
        };
        await userRepository.create(testUser);

        // Create test category
        testCategory = {
            CATEGORIES_ID: 'test-category-id',
            NAME: 'Test Category'
        };
        await categoryRepository.create(testCategory);

        // Create test stock
        testStock = {
            ISIN: 'TEST123456789',
            CATEGORIES_ID: testCategory.CATEGORIES_ID,
            NAME: 'Test Stock',
            WKN: 'TEST123',
            SYMBOL: 'TST'
        };
        await stockRepository.create(testStock);

        // Create test portfolio
        testPortfolio = {
            PORTFOLIOS_ID: 'test-portfolio-id',
            NAME: 'Test Portfolio',
            CREATED_AT: new Date(),
            USERS_ID: testUser.USERS_ID
        };
        await portfolioRepository.create(testPortfolio);

        // Create test holding
        testHolding = {
            HOLDINGS_ID: 'test-holding-id',
            PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
            ISIN: testStock.ISIN,
            QUANTITY: 100,
            START_DATE: new Date('2024-01-01'),
            END_DATE: null
        };
        await holdingRepository.create(testHolding);
    });

    describe('create', () => {
        it('should create a new transaction', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                TRANSACTIONS_ID: 'test-transaction-id',
                HOLDINGS_ID: testHolding.HOLDINGS_ID,
                BUY: true,
                TRANSACTION_TIME: new Date(),
                AMOUNT: 50,
                PRICE: 100.50,
                COMMISSION: 1.50,
                BROKER: 'Test Broker'
            };

            // Act
            const result = await transactionRepository.create(transactionData);

            // Assert
            expect(result).toBeDefined();
            expect(result.TRANSACTIONS_ID).toBe(transactionData.TRANSACTIONS_ID);
            expect(result.AMOUNT).toBe(transactionData.AMOUNT);
            expect(result.PRICE).toEqual(new Decimal(transactionData.PRICE));
            expect(result.COMMISSION).toEqual(new Decimal(transactionData.COMMISSION));

            // Verify the transaction was actually saved
            const savedTransaction = await prisma.transaction.findUnique({
                where: { TRANSACTIONS_ID: transactionData.TRANSACTIONS_ID }
            });
            expect(savedTransaction).toBeDefined();
            expect(savedTransaction?.AMOUNT).toBe(transactionData.AMOUNT);
        });

        it('should throw an error if holding does not exist', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                TRANSACTIONS_ID: 'test-transaction-id',
                HOLDINGS_ID: 'non-existent-holding',
                BUY: true,
                TRANSACTION_TIME: new Date(),
                AMOUNT: 50,
                PRICE: 100.50,
                COMMISSION: 1.50,
                BROKER: 'Test Broker'
            };

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Holding not found');
        });

        it('should throw an error if amount is not positive', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                TRANSACTIONS_ID: 'test-transaction-id',
                HOLDINGS_ID: testHolding.HOLDINGS_ID,
                BUY: true,
                TRANSACTION_TIME: new Date(),
                AMOUNT: 0,
                PRICE: 100.50,
                COMMISSION: 1.50,
                BROKER: 'Test Broker'
            };

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Amount must be positive');
        });

        it('should throw an error if price is not positive', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                TRANSACTIONS_ID: 'test-transaction-id',
                HOLDINGS_ID: testHolding.HOLDINGS_ID,
                BUY: true,
                TRANSACTION_TIME: new Date(),
                AMOUNT: 50,
                PRICE: 0,
                COMMISSION: 1.50,
                BROKER: 'Test Broker'
            };

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Price must be positive');
        });

        it('should throw an error if commission is negative', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                TRANSACTIONS_ID: 'test-transaction-id',
                HOLDINGS_ID: testHolding.HOLDINGS_ID,
                BUY: true,
                TRANSACTION_TIME: new Date(),
                AMOUNT: 50,
                PRICE: 100.50,
                COMMISSION: -1.50,
                BROKER: 'Test Broker'
            };

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Commission cannot be negative');
        });
    });

    describe('findByHolding', () => {
        it('should find all transactions for a holding', async () => {
            // Arrange
            const transactions: CreateTransactionInput[] = [
                {
                    TRANSACTIONS_ID: 'transaction-1',
                    HOLDINGS_ID: testHolding.HOLDINGS_ID,
                    BUY: true,
                    TRANSACTION_TIME: new Date('2024-01-01T10:00:00Z'),
                    AMOUNT: 50,
                    PRICE: 100.50,
                    COMMISSION: 1.50,
                    BROKER: 'Test Broker'
                },
                {
                    TRANSACTIONS_ID: 'transaction-2',
                    HOLDINGS_ID: testHolding.HOLDINGS_ID,
                    BUY: false,
                    TRANSACTION_TIME: new Date('2024-01-01T11:00:00Z'),
                    AMOUNT: 25,
                    PRICE: 110.50,
                    COMMISSION: 1.50,
                    BROKER: 'Test Broker'
                }
            ];
            await Promise.all(transactions.map(t => transactionRepository.create(t)));

            // Act
            const result = await transactionRepository.findByHolding(testHolding.HOLDINGS_ID);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].TRANSACTION_TIME.getTime()).toBeGreaterThan(
                result[1].TRANSACTION_TIME.getTime()
            ); // Check descending order
        });
    });

    describe('findByHoldingAndType', () => {
        it('should find only buy transactions', async () => {
            // Arrange
            const transactions: CreateTransactionInput[] = [
                {
                    TRANSACTIONS_ID: 'transaction-1',
                    HOLDINGS_ID: testHolding.HOLDINGS_ID,
                    BUY: true,
                    TRANSACTION_TIME: new Date('2024-01-01T10:00:00Z'),
                    AMOUNT: 50,
                    PRICE: 100.50,
                    COMMISSION: 1.50,
                    BROKER: 'Test Broker'
                },
                {
                    TRANSACTIONS_ID: 'transaction-2',
                    HOLDINGS_ID: testHolding.HOLDINGS_ID,
                    BUY: false,
                    TRANSACTION_TIME: new Date('2024-01-01T11:00:00Z'),
                    AMOUNT: 25,
                    PRICE: 110.50,
                    COMMISSION: 1.50,
                    BROKER: 'Test Broker'
                }
            ];
            await Promise.all(transactions.map(t => transactionRepository.create(t)));

            // Act
            const result = await transactionRepository.findByHoldingAndType(testHolding.HOLDINGS_ID, true);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].BUY).toBe(true);
        });
    });

    describe('getTotalAmount', () => {
        it('should calculate net amount correctly', async () => {
            // Arrange
            const transactions: CreateTransactionInput[] = [
                {
                    TRANSACTIONS_ID: 'transaction-1',
                    HOLDINGS_ID: testHolding.HOLDINGS_ID,
                    BUY: true,
                    TRANSACTION_TIME: new Date('2024-01-01T10:00:00Z'),
                    AMOUNT: 50,
                    PRICE: 100.50,
                    COMMISSION: 1.50,
                    BROKER: 'Test Broker'
                },
                {
                    TRANSACTIONS_ID: 'transaction-2',
                    HOLDINGS_ID: testHolding.HOLDINGS_ID,
                    BUY: false,
                    TRANSACTION_TIME: new Date('2024-01-01T11:00:00Z'),
                    AMOUNT: 20,
                    PRICE: 110.50,
                    COMMISSION: 1.50,
                    BROKER: 'Test Broker'
                }
            ];
            await Promise.all(transactions.map(t => transactionRepository.create(t)));

            // Act
            const result = await transactionRepository.getTotalAmount(testHolding.HOLDINGS_ID);

            // Assert
            expect(result).toBe(30); // 50 bought - 20 sold = 30
        });
    });

    describe('getTotalValue', () => {
        it('should calculate total value correctly', async () => {
            // Arrange
            const transactions: CreateTransactionInput[] = [
                {
                    TRANSACTIONS_ID: 'transaction-1',
                    HOLDINGS_ID: testHolding.HOLDINGS_ID,
                    BUY: true,
                    TRANSACTION_TIME: new Date('2024-01-01T10:00:00Z'),
                    AMOUNT: 50,
                    PRICE: 100,
                    COMMISSION: 1.50,
                    BROKER: 'Test Broker'
                },
                {
                    TRANSACTIONS_ID: 'transaction-2',
                    HOLDINGS_ID: testHolding.HOLDINGS_ID,
                    BUY: false,
                    TRANSACTION_TIME: new Date('2024-01-01T11:00:00Z'),
                    AMOUNT: 20,
                    PRICE: 110,
                    COMMISSION: 1.50,
                    BROKER: 'Test Broker'
                }
            ];
            await Promise.all(transactions.map(t => transactionRepository.create(t)));

            // Act
            const result = await transactionRepository.getTotalValue(testHolding.HOLDINGS_ID);

            // Assert
            // 50 * 100 bought - 20 * 110 sold = 5000 - 2200 = 2800
            expect(result).toEqual(new Decimal(2800));
        });
    });

    describe('getTotalCommission', () => {
        it('should calculate total commission correctly', async () => {
            // Arrange
            const transactions: CreateTransactionInput[] = [
                {
                    TRANSACTIONS_ID: 'transaction-1',
                    HOLDINGS_ID: testHolding.HOLDINGS_ID,
                    BUY: true,
                    TRANSACTION_TIME: new Date('2024-01-01T10:00:00Z'),
                    AMOUNT: 50,
                    PRICE: 100.50,
                    COMMISSION: 1.50,
                    BROKER: 'Test Broker'
                },
                {
                    TRANSACTIONS_ID: 'transaction-2',
                    HOLDINGS_ID: testHolding.HOLDINGS_ID,
                    BUY: false,
                    TRANSACTION_TIME: new Date('2024-01-01T11:00:00Z'),
                    AMOUNT: 20,
                    PRICE: 110.50,
                    COMMISSION: 2.50,
                    BROKER: 'Test Broker'
                }
            ];
            await Promise.all(transactions.map(t => transactionRepository.create(t)));

            // Act
            const result = await transactionRepository.getTotalCommission(testHolding.HOLDINGS_ID);

            // Assert
            expect(result).toEqual(new Decimal(4.00)); // 1.50 + 2.50 = 4.00
        });
    });
});
