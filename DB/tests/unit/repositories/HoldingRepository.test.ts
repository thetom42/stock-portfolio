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
    });

    describe('create', () => {
        it('should create a new holding', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                ISIN: testStock.ISIN,
                QUANTITY: 100,
                START_DATE: new Date('2024-01-01'),
                END_DATE: null
            };

            // Act
            const result = await holdingRepository.create(holdingData);

            // Assert
            expect(result).toBeDefined();
            expect(result.HOLDINGS_ID).toBe(holdingData.HOLDINGS_ID);
            expect(result.QUANTITY).toBe(holdingData.QUANTITY);

            // Verify the holding was actually saved
            const savedHolding = await prisma.holding.findUnique({
                where: { HOLDINGS_ID: holdingData.HOLDINGS_ID }
            });
            expect(savedHolding).toBeDefined();
            expect(savedHolding?.QUANTITY).toBe(holdingData.QUANTITY);
        });

        it('should throw an error if portfolio does not exist', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: 'non-existent-portfolio',
                ISIN: testStock.ISIN,
                QUANTITY: 100,
                START_DATE: new Date('2024-01-01'),
                END_DATE: null
            };

            // Act & Assert
            await expect(holdingRepository.create(holdingData))
                .rejects
                .toThrow('Portfolio not found');
        });

        it('should throw an error if stock does not exist', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                ISIN: 'non-existent-isin',
                QUANTITY: 100,
                START_DATE: new Date('2024-01-01'),
                END_DATE: null
            };

            // Act & Assert
            await expect(holdingRepository.create(holdingData))
                .rejects
                .toThrow('Stock not found');
        });

        it('should throw an error if quantity is not positive', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                ISIN: testStock.ISIN,
                QUANTITY: 0,
                START_DATE: new Date('2024-01-01'),
                END_DATE: null
            };

            // Act & Assert
            await expect(holdingRepository.create(holdingData))
                .rejects
                .toThrow('Quantity must be positive');
        });

        it('should throw an error if end date is before start date', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                ISIN: testStock.ISIN,
                QUANTITY: 100,
                START_DATE: new Date('2024-01-02'),
                END_DATE: new Date('2024-01-01')
            };

            // Act & Assert
            await expect(holdingRepository.create(holdingData))
                .rejects
                .toThrow('Start date must be before end date');
        });
    });

    describe('findByPortfolio', () => {
        it('should find all holdings for a portfolio', async () => {
            // Arrange
            const holdings: Holding[] = [
                {
                    HOLDINGS_ID: 'holding-1',
                    PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                    ISIN: testStock.ISIN,
                    QUANTITY: 100,
                    START_DATE: new Date('2024-01-01'),
                    END_DATE: null
                },
                {
                    HOLDINGS_ID: 'holding-2',
                    PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                    ISIN: testStock.ISIN,
                    QUANTITY: 200,
                    START_DATE: new Date('2024-01-02'),
                    END_DATE: null
                }
            ];
            await Promise.all(holdings.map(holding => holdingRepository.create(holding)));

            // Act
            const result = await holdingRepository.findByPortfolio(testPortfolio.PORTFOLIOS_ID);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].START_DATE.getTime()).toBeGreaterThan(result[1].START_DATE.getTime()); // Check descending order
        });
    });

    describe('findActiveByPortfolio', () => {
        it('should find only active holdings for a portfolio', async () => {
            // Arrange
            const holdings: Holding[] = [
                {
                    HOLDINGS_ID: 'holding-1',
                    PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                    ISIN: testStock.ISIN,
                    QUANTITY: 100,
                    START_DATE: new Date('2024-01-01'),
                    END_DATE: null
                },
                {
                    HOLDINGS_ID: 'holding-2',
                    PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                    ISIN: testStock.ISIN,
                    QUANTITY: 200,
                    START_DATE: new Date('2024-01-01'),
                    END_DATE: new Date('2024-01-02')
                }
            ];
            await Promise.all(holdings.map(holding => holdingRepository.create(holding)));

            // Act
            const result = await holdingRepository.findActiveByPortfolio(testPortfolio.PORTFOLIOS_ID);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].HOLDINGS_ID).toBe('holding-1');
        });
    });

    describe('closeHolding', () => {
        it('should close an active holding', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                ISIN: testStock.ISIN,
                QUANTITY: 100,
                START_DATE: new Date('2024-01-01'),
                END_DATE: null
            };
            await holdingRepository.create(holdingData);

            const endDate = new Date('2024-01-02');

            // Act
            const result = await holdingRepository.closeHolding(holdingData.HOLDINGS_ID, endDate);

            // Assert
            expect(result.END_DATE).toEqual(endDate);

            // Verify the update was persisted
            const updatedHolding = await prisma.holding.findUnique({
                where: { HOLDINGS_ID: holdingData.HOLDINGS_ID }
            });
            expect(updatedHolding?.END_DATE).toEqual(endDate);
        });

        it('should throw an error if holding is already closed', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                ISIN: testStock.ISIN,
                QUANTITY: 100,
                START_DATE: new Date('2024-01-01'),
                END_DATE: new Date('2024-01-02')
            };
            await holdingRepository.create(holdingData);

            // Act & Assert
            await expect(holdingRepository.closeHolding(
                holdingData.HOLDINGS_ID,
                new Date('2024-01-03')
            ))
                .rejects
                .toThrow('Holding is already closed');
        });
    });

    describe('updateQuantity', () => {
        it('should update holding quantity', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                ISIN: testStock.ISIN,
                QUANTITY: 100,
                START_DATE: new Date('2024-01-01'),
                END_DATE: null
            };
            await holdingRepository.create(holdingData);

            // Act
            const result = await holdingRepository.updateQuantity(holdingData.HOLDINGS_ID, 150);

            // Assert
            expect(result.QUANTITY).toBe(150);

            // Verify the update was persisted
            const updatedHolding = await prisma.holding.findUnique({
                where: { HOLDINGS_ID: holdingData.HOLDINGS_ID }
            });
            expect(updatedHolding?.QUANTITY).toBe(150);
        });

        it('should throw an error if quantity is not positive', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                ISIN: testStock.ISIN,
                QUANTITY: 100,
                START_DATE: new Date('2024-01-01'),
                END_DATE: null
            };
            await holdingRepository.create(holdingData);

            // Act & Assert
            await expect(holdingRepository.updateQuantity(holdingData.HOLDINGS_ID, 0))
                .rejects
                .toThrow('Quantity must be positive');
        });
    });

    describe('delete', () => {
        it('should delete a holding', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                ISIN: testStock.ISIN,
                QUANTITY: 100,
                START_DATE: new Date('2024-01-01'),
                END_DATE: null
            };
            await holdingRepository.create(holdingData);

            // Act
            const result = await holdingRepository.delete(holdingData.HOLDINGS_ID);

            // Assert
            expect(result.HOLDINGS_ID).toBe(holdingData.HOLDINGS_ID);

            // Verify the holding was actually deleted
            const deletedHolding = await prisma.holding.findUnique({
                where: { HOLDINGS_ID: holdingData.HOLDINGS_ID }
            });
            expect(deletedHolding).toBeNull();
        });

        it('should throw an error if holding has transactions', async () => {
            // Arrange
            const holdingData: Holding = {
                HOLDINGS_ID: 'test-holding-id',
                PORTFOLIOS_ID: testPortfolio.PORTFOLIOS_ID,
                ISIN: testStock.ISIN,
                QUANTITY: 100,
                START_DATE: new Date('2024-01-01'),
                END_DATE: null
            };
            await holdingRepository.create(holdingData);

            // Create a transaction for the holding
            await prisma.transaction.create({
                data: {
                    TRANSACTIONS_ID: 'test-transaction-id',
                    HOLDINGS_ID: holdingData.HOLDINGS_ID,
                    BUY: true,
                    TRANSACTION_TIME: new Date(),
                    AMOUNT: 100,
                    PRICE: new Decimal(50.00),
                    COMMISSION: new Decimal(1.00),
                    BROKER: 'Test Broker'
                }
            });

            // Act & Assert
            await expect(holdingRepository.delete(holdingData.HOLDINGS_ID))
                .rejects
                .toThrow('Cannot delete holding with associated transactions');
        });
    });
});
