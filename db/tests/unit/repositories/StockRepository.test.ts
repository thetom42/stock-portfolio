import { PrismaClient } from '@prisma/client';
import { StockRepository } from '../../../repositories/StockRepository';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { Stock } from '../../../models/Stock';
import { Category } from '../../../models/Category';
import { getPrismaClient, clearDatabase } from '../../helpers/prisma';

describe('StockRepository', () => {
    let stockRepository: StockRepository;
    let categoryRepository: CategoryRepository;
    let prisma: PrismaClient;
    let testCategory: Category;

    beforeEach(async () => {
        prisma = getPrismaClient();
        stockRepository = new StockRepository(prisma);
        categoryRepository = new CategoryRepository(prisma);
        await clearDatabase();

        // Create a test category
        testCategory = {
            CATEGORIES_ID: 'test-category-id',
            NAME: 'Test Category'
        };
        await categoryRepository.create(testCategory);
    });

    describe('create', () => {
        it('should create a new stock', async () => {
            // Arrange
            const stockData: Stock = {
                ISIN: 'TEST123456789',
                CATEGORIES_ID: testCategory.CATEGORIES_ID,
                NAME: 'Test Stock',
                WKN: 'TEST123',
                SYMBOL: 'TST'
            };

            // Act
            const result = await stockRepository.create(stockData);

            // Assert
            expect(result).toBeDefined();
            expect(result.ISIN).toBe(stockData.ISIN);
            expect(result.NAME).toBe(stockData.NAME);
            expect(result.CATEGORIES_ID).toBe(stockData.CATEGORIES_ID);

            // Verify the stock was actually saved
            const savedStock = await prisma.stock.findUnique({
                where: { ISIN: stockData.ISIN }
            });
            expect(savedStock).toBeDefined();
            expect(savedStock?.NAME).toBe(stockData.NAME);
        });

        it('should throw an error if category does not exist', async () => {
            // Arrange
            const stockData: Stock = {
                ISIN: 'TEST123456789',
                CATEGORIES_ID: 'non-existent-category',
                NAME: 'Test Stock',
                WKN: 'TEST123',
                SYMBOL: 'TST'
            };

            // Act & Assert
            await expect(stockRepository.create(stockData))
                .rejects
                .toThrow('Category not found');
        });

        it('should throw an error if ISIN already exists', async () => {
            // Arrange
            const stockData: Stock = {
                ISIN: 'TEST123456789',
                CATEGORIES_ID: testCategory.CATEGORIES_ID,
                NAME: 'Test Stock',
                WKN: 'TEST123',
                SYMBOL: 'TST'
            };
            await stockRepository.create(stockData);

            // Act & Assert
            const duplicateStock = { ...stockData, NAME: 'Different Name' };
            await expect(stockRepository.create(duplicateStock))
                .rejects
                .toThrow('Stock with this ISIN already exists');
        });

        it('should throw an error if WKN already exists', async () => {
            // Arrange
            const stockData: Stock = {
                ISIN: 'TEST123456789',
                CATEGORIES_ID: testCategory.CATEGORIES_ID,
                NAME: 'Test Stock',
                WKN: 'TEST123',
                SYMBOL: 'TST'
            };
            await stockRepository.create(stockData);

            // Act & Assert
            const duplicateStock = { 
                ...stockData, 
                ISIN: 'DIFFERENT123456',
                SYMBOL: 'DIF'
            };
            await expect(stockRepository.create(duplicateStock))
                .rejects
                .toThrow('Stock with this WKN already exists');
        });

        it('should throw an error if SYMBOL already exists', async () => {
            // Arrange
            const stockData: Stock = {
                ISIN: 'TEST123456789',
                CATEGORIES_ID: testCategory.CATEGORIES_ID,
                NAME: 'Test Stock',
                WKN: 'TEST123',
                SYMBOL: 'TST'
            };
            await stockRepository.create(stockData);

            // Act & Assert
            const duplicateStock = { 
                ...stockData, 
                ISIN: 'DIFFERENT123456',
                WKN: 'DIFF123'
            };
            await expect(stockRepository.create(duplicateStock))
                .rejects
                .toThrow('Stock with this SYMBOL already exists');
        });
    });

    describe('findByISIN', () => {
        it('should find a stock by ISIN', async () => {
            // Arrange
            const stockData: Stock = {
                ISIN: 'TEST123456789',
                CATEGORIES_ID: testCategory.CATEGORIES_ID,
                NAME: 'Test Stock',
                WKN: 'TEST123',
                SYMBOL: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            // Act
            const result = await stockRepository.findByISIN(stockData.ISIN);

            // Assert
            expect(result).toBeDefined();
            expect(result?.ISIN).toBe(stockData.ISIN);
            expect(result?.NAME).toBe(stockData.NAME);
        });

        it('should return null if stock is not found', async () => {
            // Act
            const result = await stockRepository.findByISIN('non-existent-isin');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findByCategory', () => {
        it('should find all stocks in a category', async () => {
            // Arrange
            const stocks = [
                {
                    ISIN: 'TEST123456789',
                    CATEGORIES_ID: testCategory.CATEGORIES_ID,
                    NAME: 'Test Stock 1',
                    WKN: 'TEST123',
                    SYMBOL: 'TST1'
                },
                {
                    ISIN: 'TEST987654321',
                    CATEGORIES_ID: testCategory.CATEGORIES_ID,
                    NAME: 'Test Stock 2',
                    WKN: 'TEST987',
                    SYMBOL: 'TST2'
                }
            ];
            await Promise.all(stocks.map(stock => 
                prisma.stock.create({ data: stock })
            ));

            // Act
            const result = await stockRepository.findByCategory(testCategory.CATEGORIES_ID);

            // Assert
            expect(result).toHaveLength(2);
            expect(result).toEqual(expect.arrayContaining(
                stocks.map(stock => expect.objectContaining(stock))
            ));
        });

        it('should return empty array when category has no stocks', async () => {
            // Act
            const result = await stockRepository.findByCategory(testCategory.CATEGORIES_ID);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update a stock', async () => {
            // Arrange
            const stockData: Stock = {
                ISIN: 'TEST123456789',
                CATEGORIES_ID: testCategory.CATEGORIES_ID,
                NAME: 'Test Stock',
                WKN: 'TEST123',
                SYMBOL: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            const updateData = {
                NAME: 'Updated Stock Name'
            };

            // Act
            const result = await stockRepository.update(stockData.ISIN, updateData);

            // Assert
            expect(result).toBeDefined();
            expect(result.NAME).toBe(updateData.NAME);
            expect(result.CATEGORIES_ID).toBe(stockData.CATEGORIES_ID); // Unchanged field

            // Verify the update was persisted
            const updatedStock = await prisma.stock.findUnique({
                where: { ISIN: stockData.ISIN }
            });
            expect(updatedStock?.NAME).toBe(updateData.NAME);
        });

        it('should throw an error if stock does not exist', async () => {
            // Act & Assert
            await expect(stockRepository.update('non-existent-isin', { NAME: 'New Name' }))
                .rejects
                .toThrow('Stock not found');
        });

        it('should throw an error if updated category does not exist', async () => {
            // Arrange
            const stockData: Stock = {
                ISIN: 'TEST123456789',
                CATEGORIES_ID: testCategory.CATEGORIES_ID,
                NAME: 'Test Stock',
                WKN: 'TEST123',
                SYMBOL: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            // Act & Assert
            await expect(stockRepository.update(stockData.ISIN, { CATEGORIES_ID: 'non-existent-category' }))
                .rejects
                .toThrow('Category not found');
        });
    });

    describe('delete', () => {
        it('should delete a stock', async () => {
            // Arrange
            const stockData: Stock = {
                ISIN: 'TEST123456789',
                CATEGORIES_ID: testCategory.CATEGORIES_ID,
                NAME: 'Test Stock',
                WKN: 'TEST123',
                SYMBOL: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            // Act
            const result = await stockRepository.delete(stockData.ISIN);

            // Assert
            expect(result).toBeDefined();
            expect(result.ISIN).toBe(stockData.ISIN);

            // Verify the stock was actually deleted
            const deletedStock = await prisma.stock.findUnique({
                where: { ISIN: stockData.ISIN }
            });
            expect(deletedStock).toBeNull();
        });

        it('should throw an error if stock does not exist', async () => {
            // Act & Assert
            await expect(stockRepository.delete('non-existent-isin'))
                .rejects
                .toThrow('Stock not found');
        });
    });
});
