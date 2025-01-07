import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { HoldingRepository } from '../../../src/repositories/HoldingRepository';
import { PortfolioRepository } from '../../../src/repositories/PortfolioRepository';
import { StockRepository } from '../../../src/repositories/StockRepository';
import { CategoryRepository } from '../../../src/repositories/CategoryRepository';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { Holding } from '../../../src/models/Holding';
import { Portfolio } from '../../../src/models/Portfolio';
import { Stock } from '../../../src/models/Stock';
import { Category } from '../../../src/models/Category';
import { User } from '../../../src/models/User';
import { getPrismaClient, clearDatabase } from '../../helpers/prisma';

describe('HoldingRepository', () => {
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

    beforeEach(async () => {
        prisma = getPrismaClient();
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
    });

    describe('create', () => {
        it('should create a new holding', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };

            // Act
            const result = await holdingRepository.create(holdingData);

            // Assert
            expect(result).toBeDefined();
            expect(result.holding_id).toBe(holdingData.holding_id);
            expect(result.quantity).toBe(holdingData.quantity);

            // Verify the holding was actually saved
            const savedHolding = await prisma.holding.findUnique({
                where: { holding_id: holdingData.holding_id }
            });
            expect(savedHolding).toBeDefined();
            expect(savedHolding?.quantity).toBe(holdingData.quantity);
        });

        it('should throw an error if portfolio does not exist', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: 'non-existent-portfolio',
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };

            // Act & Assert
            await expect(holdingRepository.create(holdingData))
                .rejects
                .toThrow('Portfolio not found');
        });

        it('should throw an error if stock does not exist', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: 'non-existent-isin',
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };

            // Act & Assert
            await expect(holdingRepository.create(holdingData))
                .rejects
                .toThrow('Stock not found');
        });

        it('should throw an error if quantity is not positive', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 0,
                start_date: new Date('2024-01-01'),
                end_date: null
            };

            // Act & Assert
            await expect(holdingRepository.create(holdingData))
                .rejects
                .toThrow('Quantity must be positive');
        });

        it('should throw an error if end date is before start date', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-02'),
                end_date: new Date('2024-01-01')
            };

            // Act & Assert
            await expect(holdingRepository.create(holdingData))
                .rejects
                .toThrow('Start date must be before end date');
        });

        it('should throw an error if holding already exists', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Act & Assert
            await expect(holdingRepository.create(holdingData))
                .rejects
                .toThrow('Holding already exists');
        });

        it('should handle unexpected errors during creation', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };

            // Mock prisma create to throw an unexpected error
            jest.spyOn(prisma.holding, 'create').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(holdingRepository.create(holdingData))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('findByPortfolioId', () => {
        it('should find all holdings for a portfolio', async () => {
            // Arrange
            const holdings: Holding[] = [
                {
                    holding_id: 'holding-1',
                    portfolio_id: testPortfolio.portfolio_id,
                    isin: testStock.isin,
                    quantity: 100,
                    start_date: new Date('2024-01-01'),
                    end_date: null
                },
                {
                    holding_id: 'holding-2',
                    portfolio_id: testPortfolio.portfolio_id,
                    isin: testStock.isin,
                    quantity: 200,
                    start_date: new Date('2024-01-02'),
                    end_date: null
                }
            ];
            await Promise.all(holdings.map(holding => holdingRepository.create(holding)));

            // Act
            const result = await holdingRepository.findByPortfolioId(testPortfolio.portfolio_id);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].start_date.getTime()).toBeGreaterThan(result[1].start_date.getTime()); // Check descending order
        });

        it('should return empty array when portfolio has no holdings', async () => {
            // Act
            const result = await holdingRepository.findByPortfolioId(testPortfolio.portfolio_id);

            // Assert
            expect(result).toEqual([]);
        });

        it('should handle unexpected errors during findByPortfolioId', async () => {
            // Mock prisma findMany to throw an unexpected error
            jest.spyOn(prisma.holding, 'findMany').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(holdingRepository.findByPortfolioId(testPortfolio.portfolio_id))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('findActiveByPortfolioId', () => {
        it('should find only active holdings for a portfolio', async () => {
            // Arrange
            const holdings: Holding[] = [
                {
                    holding_id: 'holding-1',
                    portfolio_id: testPortfolio.portfolio_id,
                    isin: testStock.isin,
                    quantity: 100,
                    start_date: new Date('2024-01-01'),
                    end_date: null
                },
                {
                    holding_id: 'holding-2',
                    portfolio_id: testPortfolio.portfolio_id,
                    isin: testStock.isin,
                    quantity: 200,
                    start_date: new Date('2024-01-01'),
                    end_date: new Date('2024-01-02')
                }
            ];
            await Promise.all(holdings.map(holding => holdingRepository.create(holding)));

            // Act
            const result = await holdingRepository.findActiveByPortfolioId(testPortfolio.portfolio_id);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].holding_id).toBe('holding-1');
        });

        it('should return empty array when portfolio has no active holdings', async () => {
            // Arrange
            const holding: Holding = {
                holding_id: 'holding-1',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: new Date('2024-01-02')
            };
            await holdingRepository.create(holding);

            // Act
            const result = await holdingRepository.findActiveByPortfolioId(testPortfolio.portfolio_id);

            // Assert
            expect(result).toEqual([]);
        });

        it('should handle unexpected errors during findActiveByPortfolioId', async () => {
            // Mock prisma findMany to throw an unexpected error
            jest.spyOn(prisma.holding, 'findMany').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(holdingRepository.findActiveByPortfolioId(testPortfolio.portfolio_id))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('update', () => {
        it('should update a holding', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            const updateData = {
                quantity: 150,
                end_date: new Date('2024-01-02')
            };

            // Act
            const result = await holdingRepository.update(holdingData.holding_id, updateData);

            // Assert
            expect(result.quantity).toBe(updateData.quantity);
            expect(result.end_date).toEqual(updateData.end_date);

            // Verify the update was persisted
            const updatedHolding = await prisma.holding.findUnique({
                where: { holding_id: holdingData.holding_id }
            });
            expect(updatedHolding?.quantity).toBe(updateData.quantity);
            expect(updatedHolding?.end_date).toEqual(updateData.end_date);
        });

        it('should throw an error if holding does not exist', async () => {
            // Act & Assert
            await expect(holdingRepository.update('non-existent-id', { quantity: 150 }))
                .rejects
                .toThrow('Holding not found');
        });

        it('should throw an error if quantity is not positive', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Act & Assert
            await expect(holdingRepository.update(holdingData.holding_id, { quantity: 0 }))
                .rejects
                .toThrow('Quantity must be positive');
        });

        it('should throw an error if end date is before start date', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-02'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Act & Assert
            await expect(holdingRepository.update(holdingData.holding_id, { end_date: new Date('2024-01-01') }))
                .rejects
                .toThrow('Start date must be before end date');
        });

        it('should throw an error if updated portfolio does not exist', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Act & Assert
            await expect(holdingRepository.update(holdingData.holding_id, { portfolio_id: 'non-existent-portfolio' }))
                .rejects
                .toThrow('Portfolio not found');
        });

        it('should throw an error if updated stock does not exist', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Act & Assert
            await expect(holdingRepository.update(holdingData.holding_id, { isin: 'non-existent-isin' }))
                .rejects
                .toThrow('Stock not found');
        });

        it('should handle unexpected errors during update', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Mock prisma update to throw an unexpected error
            jest.spyOn(prisma.holding, 'update').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(holdingRepository.update(holdingData.holding_id, { quantity: 150 }))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('delete', () => {
        it('should delete a holding', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Act
            const result = await holdingRepository.delete(holdingData.holding_id);

            // Assert
            expect(result.holding_id).toBe(holdingData.holding_id);

            // Verify the holding was actually deleted
            const deletedHolding = await prisma.holding.findUnique({
                where: { holding_id: holdingData.holding_id }
            });
            expect(deletedHolding).toBeNull();
        });

        it('should throw an error if holding does not exist', async () => {
            // Act & Assert
            await expect(holdingRepository.delete('non-existent-id'))
                .rejects
                .toThrow('Holding not found');
        });

        it('should throw an error if holding has transactions', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Create a transaction for the holding
            await prisma.transaction.create({
                data: {
                    transaction_id: 'test-transaction-id',
                    holding_id: holdingData.holding_id,
                    buy: true,
                    transaction_time: new Date(),
                    amount: 100,
                    price: new Decimal(50.00),
                    commission: new Decimal(1.00),
                    broker: 'Test Broker'
                }
            });

            // Act & Assert
            await expect(holdingRepository.delete(holdingData.holding_id))
                .rejects
                .toThrow('Cannot delete holding with associated transactions');
        });

        it('should handle unexpected errors during deletion', async () => {
            // Arrange
            const holdingData: Holding = {
                holding_id: 'test-holding-id',
                portfolio_id: testPortfolio.portfolio_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Mock prisma delete to throw an unexpected error
            jest.spyOn(prisma.holding, 'delete').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(holdingRepository.delete(holdingData.holding_id))
                .rejects
                .toThrow('Unexpected error');
        });
    });
});
