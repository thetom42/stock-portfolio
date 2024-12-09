import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { HoldingRepository } from '../../../repositories/HoldingRepository';
import { PortfolioRepository } from '../../../repositories/PortfolioRepository';
import { StockRepository } from '../../../repositories/StockRepository';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { UserRepository } from '../../../repositories/UserRepository';
import { Holding } from '../../../models/Holding';
import { Portfolio } from '../../../models/Portfolio';
import { Stock } from '../../../models/Stock';
import { Category } from '../../../models/Category';
import { User } from '../../../models/User';
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
    });

    describe('create', () => {
        it('should create a new holding', async () => {
            // Arrange
            const holdingData: Holding = {
                holdings_id: 'test-holding-id',
                portfolios_id: testPortfolio.portfolios_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };

            // Act
            const result = await holdingRepository.create(holdingData);

            // Assert
            expect(result).toBeDefined();
            expect(result.holdings_id).toBe(holdingData.holdings_id);
            expect(result.quantity).toBe(holdingData.quantity);

            // Verify the holding was actually saved
            const savedHolding = await prisma.holding.findUnique({
                where: { holdings_id: holdingData.holdings_id }
            });
            expect(savedHolding).toBeDefined();
            expect(savedHolding?.quantity).toBe(holdingData.quantity);
        });

        it('should throw an error if portfolio does not exist', async () => {
            // Arrange
            const holdingData: Holding = {
                holdings_id: 'test-holding-id',
                portfolios_id: 'non-existent-portfolio',
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
                holdings_id: 'test-holding-id',
                portfolios_id: testPortfolio.portfolios_id,
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
                holdings_id: 'test-holding-id',
                portfolios_id: testPortfolio.portfolios_id,
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
                holdings_id: 'test-holding-id',
                portfolios_id: testPortfolio.portfolios_id,
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
    });

    describe('findByPortfolioId', () => {
        it('should find all holdings for a portfolio', async () => {
            // Arrange
            const holdings: Holding[] = [
                {
                    holdings_id: 'holding-1',
                    portfolios_id: testPortfolio.portfolios_id,
                    isin: testStock.isin,
                    quantity: 100,
                    start_date: new Date('2024-01-01'),
                    end_date: null
                },
                {
                    holdings_id: 'holding-2',
                    portfolios_id: testPortfolio.portfolios_id,
                    isin: testStock.isin,
                    quantity: 200,
                    start_date: new Date('2024-01-02'),
                    end_date: null
                }
            ];
            await Promise.all(holdings.map(holding => holdingRepository.create(holding)));

            // Act
            const result = await holdingRepository.findByPortfolioId(testPortfolio.portfolios_id);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].start_date.getTime()).toBeGreaterThan(result[1].start_date.getTime()); // Check descending order
        });
    });

    describe('findActiveByPortfolioId', () => {
        it('should find only active holdings for a portfolio', async () => {
            // Arrange
            const holdings: Holding[] = [
                {
                    holdings_id: 'holding-1',
                    portfolios_id: testPortfolio.portfolios_id,
                    isin: testStock.isin,
                    quantity: 100,
                    start_date: new Date('2024-01-01'),
                    end_date: null
                },
                {
                    holdings_id: 'holding-2',
                    portfolios_id: testPortfolio.portfolios_id,
                    isin: testStock.isin,
                    quantity: 200,
                    start_date: new Date('2024-01-01'),
                    end_date: new Date('2024-01-02')
                }
            ];
            await Promise.all(holdings.map(holding => holdingRepository.create(holding)));

            // Act
            const result = await holdingRepository.findActiveByPortfolioId(testPortfolio.portfolios_id);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].holdings_id).toBe('holding-1');
        });
    });

    describe('update', () => {
        it('should update a holding', async () => {
            // Arrange
            const holdingData: Holding = {
                holdings_id: 'test-holding-id',
                portfolios_id: testPortfolio.portfolios_id,
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
            const result = await holdingRepository.update(holdingData.holdings_id, updateData);

            // Assert
            expect(result.quantity).toBe(updateData.quantity);
            expect(result.end_date).toEqual(updateData.end_date);

            // Verify the update was persisted
            const updatedHolding = await prisma.holding.findUnique({
                where: { holdings_id: holdingData.holdings_id }
            });
            expect(updatedHolding?.quantity).toBe(updateData.quantity);
            expect(updatedHolding?.end_date).toEqual(updateData.end_date);
        });

        it('should throw an error if quantity is not positive', async () => {
            // Arrange
            const holdingData: Holding = {
                holdings_id: 'test-holding-id',
                portfolios_id: testPortfolio.portfolios_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Act & Assert
            await expect(holdingRepository.update(holdingData.holdings_id, { quantity: 0 }))
                .rejects
                .toThrow('Quantity must be positive');
        });
    });

    describe('delete', () => {
        it('should delete a holding', async () => {
            // Arrange
            const holdingData: Holding = {
                holdings_id: 'test-holding-id',
                portfolios_id: testPortfolio.portfolios_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Act
            const result = await holdingRepository.delete(holdingData.holdings_id);

            // Assert
            expect(result.holdings_id).toBe(holdingData.holdings_id);

            // Verify the holding was actually deleted
            const deletedHolding = await prisma.holding.findUnique({
                where: { holdings_id: holdingData.holdings_id }
            });
            expect(deletedHolding).toBeNull();
        });

        it('should throw an error if holding has transactions', async () => {
            // Arrange
            const holdingData: Holding = {
                holdings_id: 'test-holding-id',
                portfolios_id: testPortfolio.portfolios_id,
                isin: testStock.isin,
                quantity: 100,
                start_date: new Date('2024-01-01'),
                end_date: null
            };
            await holdingRepository.create(holdingData);

            // Create a transaction for the holding
            await prisma.transaction.create({
                data: {
                    transactions_id: 'test-transaction-id',
                    holdings_id: holdingData.holdings_id,
                    buy: true,
                    transaction_time: new Date(),
                    amount: 100,
                    price: new Decimal(50.00),
                    commission: new Decimal(1.00),
                    broker: 'Test Broker'
                }
            });

            // Act & Assert
            await expect(holdingRepository.delete(holdingData.holdings_id))
                .rejects
                .toThrow('Cannot delete holding with associated transactions');
        });
    });
});
