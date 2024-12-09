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
            categories_id: 'test-category-id',
            name: 'Test Category'
        };
        await categoryRepository.create(testCategory);
    });

    describe('create', () => {
        it('should create a new stock', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                categories_id: testCategory.categories_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };

            // Act
            const result = await stockRepository.create(stockData);

            // Assert
            expect(result).toBeDefined();
            expect(result.isin).toBe(stockData.isin);
            expect(result.name).toBe(stockData.name);
            expect(result.categories_id).toBe(stockData.categories_id);

            // Verify the stock was actually saved
            const savedStock = await prisma.stock.findUnique({
                where: { isin: stockData.isin }
            });
            expect(savedStock).toBeDefined();
            expect(savedStock?.name).toBe(stockData.name);
        });

        it('should throw an error if category does not exist', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                categories_id: 'non-existent-category',
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };

            // Act & Assert
            await expect(stockRepository.create(stockData))
                .rejects
                .toThrow('Category not found');
        });

        it('should throw an error if isin already exists', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                categories_id: testCategory.categories_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await stockRepository.create(stockData);

            // Act & Assert
            const duplicateStock = { ...stockData, name: 'Different Name' };
            await expect(stockRepository.create(duplicateStock))
                .rejects
                .toThrow('Stock with this ISIN already exists');
        });

        it('should throw an error if wkn already exists', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                categories_id: testCategory.categories_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await stockRepository.create(stockData);

            // Act & Assert
            const duplicateStock = { 
                ...stockData, 
                isin: 'DIFFERENT123456',
                symbol: 'DIF'
            };
            await expect(stockRepository.create(duplicateStock))
                .rejects
                .toThrow('Stock with this WKN already exists');
        });

        it('should throw an error if symbol already exists', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                categories_id: testCategory.categories_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await stockRepository.create(stockData);

            // Act & Assert
            const duplicateStock = { 
                ...stockData, 
                isin: 'DIFFERENT123456',
                wkn: 'DIFF123'
            };
            await expect(stockRepository.create(duplicateStock))
                .rejects
                .toThrow('Stock with this SYMBOL already exists');
        });
    });

    describe('findByIsin', () => {
        it('should find a stock by isin', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                categories_id: testCategory.categories_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            // Act
            const result = await stockRepository.findByIsin(stockData.isin);

            // Assert
            expect(result).toBeDefined();
            expect(result?.isin).toBe(stockData.isin);
            expect(result?.name).toBe(stockData.name);
        });

        it('should return null if stock is not found', async () => {
            // Act
            const result = await stockRepository.findByIsin('non-existent-isin');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findByCategory', () => {
        it('should find all stocks in a category', async () => {
            // Arrange
            const stocks = [
                {
                    isin: 'TEST123456789',
                    categories_id: testCategory.categories_id,
                    name: 'Test Stock 1',
                    wkn: 'TEST123',
                    symbol: 'TST1'
                },
                {
                    isin: 'TEST987654321',
                    categories_id: testCategory.categories_id,
                    name: 'Test Stock 2',
                    wkn: 'TEST987',
                    symbol: 'TST2'
                }
            ];
            await Promise.all(stocks.map(stock => 
                prisma.stock.create({ data: stock })
            ));

            // Act
            const result = await stockRepository.findByCategory(testCategory.categories_id);

            // Assert
            expect(result).toHaveLength(2);
            expect(result).toEqual(expect.arrayContaining(
                stocks.map(stock => expect.objectContaining(stock))
            ));
        });

        it('should return empty array when category has no stocks', async () => {
            // Act
            const result = await stockRepository.findByCategory(testCategory.categories_id);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update a stock', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                categories_id: testCategory.categories_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            const updateData = {
                name: 'Updated Stock Name'
            };

            // Act
            const result = await stockRepository.update(stockData.isin, updateData);

            // Assert
            expect(result).toBeDefined();
            expect(result.name).toBe(updateData.name);
            expect(result.categories_id).toBe(stockData.categories_id); // Unchanged field

            // Verify the update was persisted
            const updatedStock = await prisma.stock.findUnique({
                where: { isin: stockData.isin }
            });
            expect(updatedStock?.name).toBe(updateData.name);
        });

        it('should throw an error if stock does not exist', async () => {
            // Act & Assert
            await expect(stockRepository.update('non-existent-isin', { name: 'New Name' }))
                .rejects
                .toThrow('Stock not found');
        });

        it('should throw an error if updated category does not exist', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                categories_id: testCategory.categories_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            // Act & Assert
            await expect(stockRepository.update(stockData.isin, { categories_id: 'non-existent-category' }))
                .rejects
                .toThrow('Category not found');
        });
    });

    describe('delete', () => {
        it('should delete a stock', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                categories_id: testCategory.categories_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            // Act
            const result = await stockRepository.delete(stockData.isin);

            // Assert
            expect(result).toBeDefined();
            expect(result.isin).toBe(stockData.isin);

            // Verify the stock was actually deleted
            const deletedStock = await prisma.stock.findUnique({
                where: { isin: stockData.isin }
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
