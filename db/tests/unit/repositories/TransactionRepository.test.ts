import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionRepository } from '../../../src/repositories/TransactionRepository';
import { HoldingRepository } from '../../../src/repositories/HoldingRepository';
import { PortfolioRepository } from '../../../src/repositories/PortfolioRepository';
import { StockRepository } from '../../../src/repositories/StockRepository';
import { CategoryRepository } from '../../../src/repositories/CategoryRepository';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { Transaction, CreateTransactionInput } from '../../../src/models/Transaction';
import { Holding } from '../../../src/models/Holding';
import { Portfolio } from '../../../src/models/Portfolio';
import { Stock } from '../../../src/models/Stock';
import { Category } from '../../../src/models/Category';
import { User } from '../../../src/models/User';
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
            user_id: 'test-user-id',
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
            category_id: 'test-category-id',
            name: 'Test Category'
        };
        await categoryRepository.create(testCategory);

        // Create test stock
        testStock = {
            isin: 'TEST123456789',
            category_id: testCategory.category_id,
            name: 'Test Stock',
            wkn: 'TEST123',
            symbol: 'TST'
        };
        await stockRepository.create(testStock);

        // Create test portfolio
        testPortfolio = {
            portfolio_id: 'test-portfolio-id',
            name: 'Test Portfolio',
            created_at: new Date(),
            user_id: testUser.user_id
        };
        await portfolioRepository.create(testPortfolio);

        // Create test holding
        testHolding = {
            holding_id: 'test-holding-id',
            portfolio_id: testPortfolio.portfolio_id,
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
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
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
            expect(result.transaction_id).toBe(transactionData.transaction_id);
            expect(result.amount).toBe(transactionData.amount);
            expect(result.price).toEqual(new Decimal(transactionData.price));
            expect(result.commission).toEqual(new Decimal(transactionData.commission));

            // Verify the transaction was actually saved
            const savedTransaction = await prisma.transaction.findUnique({
                where: { transaction_id: transactionData.transaction_id }
            });
            expect(savedTransaction).toBeDefined();
            expect(savedTransaction?.amount).toBe(transactionData.amount);
        });

        it('should throw an error if holding does not exist', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: 'non-existent-holding',
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
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
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
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
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
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
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

        it('should throw an error if transaction already exists', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Transaction already exists');
        });

        it('should handle Decimal price input', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: new Decimal(100.50),
                commission: 1.50,
                broker: 'Test Broker'
            };

            // Act
            const result = await transactionRepository.create(transactionData);

            // Assert
            expect(result).toBeDefined();
            expect(result.price).toEqual(new Decimal(100.50));
        });

        it('should throw an error if string price is not positive', async () => {
            // Arrange
            const transactionData = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: '0' as any, // Type assertion to bypass TypeScript check
                commission: 1.50,
                broker: 'Test Broker'
            };

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Price must be positive');
        });

        it('should handle string commission input', async () => {
            // Arrange
            const transactionData = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: '1.50' as any, // Type assertion to bypass TypeScript check
                broker: 'Test Broker'
            };

            // Act
            const result = await transactionRepository.create(transactionData);

            // Assert
            expect(result).toBeDefined();
            expect(result.commission).toEqual(new Decimal(1.50));
        });

        it('should throw an error if string commission is negative', async () => {
            // Arrange
            const transactionData = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: '-1.50' as any, // Type assertion to bypass TypeScript check
                broker: 'Test Broker'
            };

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toThrow('Commission cannot be negative');
        });

        it('should handle non-Error objects during creation', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };

            // Mock prisma create to throw a non-Error object
            jest.spyOn(prisma.transaction, 'create').mockRejectedValueOnce('Some string error');

            // Act & Assert
            await expect(transactionRepository.create(transactionData))
                .rejects
                .toBe('Some string error');
        });
    });

    describe('findById', () => {
        it('should find a transaction by ID', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act
            const result = await transactionRepository.findById(transactionData.transaction_id);

            // Assert
            expect(result).toBeDefined();
            expect(result?.transaction_id).toBe(transactionData.transaction_id);
            expect(result?.amount).toBe(transactionData.amount);
        });

        it('should return null if transaction is not found', async () => {
            // Act
            const result = await transactionRepository.findById('non-existent-id');

            // Assert
            expect(result).toBeNull();
        });

        it('should handle unexpected errors during findById', async () => {
            // Mock prisma findUnique to throw an unexpected error
            jest.spyOn(prisma.transaction, 'findUnique').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(transactionRepository.findById('test-id'))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('findByHoldingId', () => {
        it('should find all transactions for a holding', async () => {
            // Arrange
            const transactions: CreateTransactionInput[] = [
                {
                    transaction_id: 'transaction-1',
                    holding_id: testHolding.holding_id,
                    buy: true,
                    transaction_time: new Date('2024-01-01T10:00:00Z'),
                    amount: 50,
                    price: 100.50,
                    commission: 1.50,
                    broker: 'Test Broker'
                },
                {
                    transaction_id: 'transaction-2',
                    holding_id: testHolding.holding_id,
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
            const result = await transactionRepository.findByHoldingId(testHolding.holding_id);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].transaction_time.getTime()).toBeGreaterThan(
                result[1].transaction_time.getTime()
            ); // Check descending order
        });

        it('should return empty array when holding has no transactions', async () => {
            // Act
            const result = await transactionRepository.findByHoldingId(testHolding.holding_id);

            // Assert
            expect(result).toEqual([]);
        });

        it('should handle unexpected errors during findByHoldingId', async () => {
            // Mock prisma findMany to throw an unexpected error
            jest.spyOn(prisma.transaction, 'findMany').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(transactionRepository.findByHoldingId(testHolding.holding_id))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('update', () => {
        it('should update a transaction', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
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
            const result = await transactionRepository.update(transactionData.transaction_id, updateData);

            // Assert
            expect(result).toBeDefined();
            expect(result.amount).toBe(updateData.amount);
            expect(result.price).toEqual(new Decimal(updateData.price));

            // Verify the update was persisted
            const updatedTransaction = await prisma.transaction.findUnique({
                where: { transaction_id: transactionData.transaction_id }
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

        it('should throw an error if updated amount is not positive', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act & Assert
            await expect(transactionRepository.update(transactionData.transaction_id, { amount: 0 }))
                .rejects
                .toThrow('Amount must be positive');
        });

        it('should throw an error if updated price is not positive', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act & Assert
            await expect(transactionRepository.update(transactionData.transaction_id, { price: 0 }))
                .rejects
                .toThrow('Price must be positive');
        });

        it('should throw an error if updated commission is negative', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act & Assert
            await expect(transactionRepository.update(transactionData.transaction_id, { commission: -1.50 }))
                .rejects
                .toThrow('Commission cannot be negative');
        });

        it('should throw an error if updated holding does not exist', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act & Assert
            await expect(transactionRepository.update(transactionData.transaction_id, { holding_id: 'non-existent-holding' }))
                .rejects
                .toThrow('Holding not found');
        });

        it('should handle Decimal price input during update', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act
            const result = await transactionRepository.update(transactionData.transaction_id, { price: '150.75' as any });

            // Assert
            expect(result.price).toEqual(new Decimal(150.75));
        });

        it('should throw an error if updated string price is not positive', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act & Assert
            await expect(transactionRepository.update(transactionData.transaction_id, { price: '0' as any }))
                .rejects
                .toThrow('Price must be positive');
        });

        it('should handle string commission input during update', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act
            const result = await transactionRepository.update(transactionData.transaction_id, { commission: '2.50' as any });

            // Assert
            expect(result.commission).toEqual(new Decimal(2.50));
        });

        it('should throw an error if updated string commission is negative', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act & Assert
            await expect(transactionRepository.update(transactionData.transaction_id, { commission: '-1.50' as any }))
                .rejects
                .toThrow('Commission cannot be negative');
        });

        it('should handle non-Error objects during update', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Mock prisma update to throw a non-Error object
            jest.spyOn(prisma.transaction, 'update').mockRejectedValueOnce('Some string error');

            // Act & Assert
            await expect(transactionRepository.update(transactionData.transaction_id, { amount: 75 }))
                .rejects
                .toBe('Some string error');
        });
    });

    describe('delete', () => {
        it('should delete a transaction', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Act
            const result = await transactionRepository.delete(transactionData.transaction_id);

            // Assert
            expect(result).toBeDefined();
            expect(result.transaction_id).toBe(transactionData.transaction_id);

            // Verify the transaction was actually deleted
            const deletedTransaction = await prisma.transaction.findUnique({
                where: { transaction_id: transactionData.transaction_id }
            });
            expect(deletedTransaction).toBeNull();
        });

        it('should throw an error if transaction does not exist', async () => {
            // Act & Assert
            await expect(transactionRepository.delete('non-existent-id'))
                .rejects
                .toThrow('Transaction not found');
        });

        it('should handle unexpected errors during deletion', async () => {
            // Arrange
            const transactionData: CreateTransactionInput = {
                transaction_id: 'test-transaction-id',
                holding_id: testHolding.holding_id,
                buy: true,
                transaction_time: new Date(),
                amount: 50,
                price: 100.50,
                commission: 1.50,
                broker: 'Test Broker'
            };
            await transactionRepository.create(transactionData);

            // Mock prisma delete to throw a non-Error object
            jest.spyOn(prisma.transaction, 'delete').mockRejectedValueOnce('Some string error');

            // Act & Assert
            await expect(transactionRepository.delete(transactionData.transaction_id))
                .rejects
                .toBe('Some string error');
        });
    });
});
