import { PrismaClient } from '@prisma/client';
import { StockRepository } from '../../../repositories/StockRepository';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { UserRepository } from '../../../repositories/UserRepository';
import { Stock } from '../../../models/Stock';
import { Category } from '../../../models/Category';
import { User } from '../../../models/User';
import { getPrismaClient, clearDatabase } from '../../helpers/prisma';

describe('StockRepository', () => {
    let stockRepository: StockRepository;
    let categoryRepository: CategoryRepository;
    let userRepository: UserRepository;
    let prisma: PrismaClient;
    let testCategory: Category;
    let testUser: User;

    beforeEach(async () => {
        prisma = getPrismaClient();
        stockRepository = new StockRepository(prisma);
        categoryRepository = new CategoryRepository(prisma);
        userRepository = new UserRepository(prisma);
        await clearDatabase();

        // Create a test user
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

        // Create a test category
        testCategory = {
            category_id: 'test-category-id',
            name: 'Test Category'
        };
        await categoryRepository.create(testCategory);
    });

    describe('create', () => {
        it('should create a new stock', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                category_id: testCategory.category_id,
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
            expect(result.category_id).toBe(stockData.category_id);

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
                category_id: 'non-existent-category',
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
                category_id: testCategory.category_id,
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
                category_id: testCategory.category_id,
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
                category_id: testCategory.category_id,
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

        it('should handle unexpected errors during creation', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                category_id: testCategory.category_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };

            // Mock prisma create to throw an unexpected error
            jest.spyOn(prisma.stock, 'create').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(stockRepository.create(stockData))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('findByIsin', () => {
        it('should find a stock by isin', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                category_id: testCategory.category_id,
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

        it('should handle unexpected errors during findByIsin', async () => {
            // Mock prisma findUnique to throw an unexpected error
            jest.spyOn(prisma.stock, 'findUnique').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(stockRepository.findByIsin('TEST123456789'))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('findAll', () => {
        it('should find all stocks', async () => {
            // Arrange
            const stocks = [
                {
                    isin: 'TEST123456789',
                    category_id: testCategory.category_id,
                    name: 'Test Stock 1',
                    wkn: 'TEST123',
                    symbol: 'TST1'
                },
                {
                    isin: 'TEST987654321',
                    category_id: testCategory.category_id,
                    name: 'Test Stock 2',
                    wkn: 'TEST987',
                    symbol: 'TST2'
                }
            ];
            await Promise.all(stocks.map(stock => 
                prisma.stock.create({ data: stock })
            ));

            // Act
            const result = await stockRepository.findAll();

            // Assert
            expect(result).toHaveLength(2);
            expect(result).toEqual(expect.arrayContaining(
                stocks.map(stock => expect.objectContaining(stock))
            ));
        });

        it('should return empty array when no stocks exist', async () => {
            // Act
            const result = await stockRepository.findAll();

            // Assert
            expect(result).toEqual([]);
        });

        it('should return stocks ordered by name', async () => {
            // Arrange
            const stocks = [
                {
                    isin: 'TEST3',
                    category_id: testCategory.category_id,
                    name: 'Stock C',
                    wkn: 'TEST3',
                    symbol: 'TST3'
                },
                {
                    isin: 'TEST1',
                    category_id: testCategory.category_id,
                    name: 'Stock A',
                    wkn: 'TEST1',
                    symbol: 'TST1'
                },
                {
                    isin: 'TEST2',
                    category_id: testCategory.category_id,
                    name: 'Stock B',
                    wkn: 'TEST2',
                    symbol: 'TST2'
                }
            ];
            await Promise.all(stocks.map(stock => 
                prisma.stock.create({ data: stock })
            ));

            // Act
            const result = await stockRepository.findAll();

            // Assert
            expect(result).toHaveLength(3);
            expect(result[0].name).toBe('Stock A');
            expect(result[1].name).toBe('Stock B');
            expect(result[2].name).toBe('Stock C');
        });

        it('should handle unexpected errors during findAll', async () => {
            // Mock prisma findMany to throw an unexpected error
            jest.spyOn(prisma.stock, 'findMany').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(stockRepository.findAll())
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('findByCategory', () => {
        it('should find all stocks in a category', async () => {
            // Arrange
            const stocks = [
                {
                    isin: 'TEST123456789',
                    category_id: testCategory.category_id,
                    name: 'Test Stock 1',
                    wkn: 'TEST123',
                    symbol: 'TST1'
                },
                {
                    isin: 'TEST987654321',
                    category_id: testCategory.category_id,
                    name: 'Test Stock 2',
                    wkn: 'TEST987',
                    symbol: 'TST2'
                }
            ];
            await Promise.all(stocks.map(stock => 
                prisma.stock.create({ data: stock })
            ));

            // Act
            const result = await stockRepository.findByCategory(testCategory.category_id);

            // Assert
            expect(result).toHaveLength(2);
            expect(result).toEqual(expect.arrayContaining(
                stocks.map(stock => expect.objectContaining(stock))
            ));
        });

        it('should return empty array when category has no stocks', async () => {
            // Act
            const result = await stockRepository.findByCategory(testCategory.category_id);

            // Assert
            expect(result).toEqual([]);
        });

        it('should handle unexpected errors during findByCategory', async () => {
            // Mock prisma findMany to throw an unexpected error
            jest.spyOn(prisma.stock, 'findMany').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(stockRepository.findByCategory(testCategory.category_id))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('update', () => {
        it('should update a stock', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                category_id: testCategory.category_id,
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
            expect(result.category_id).toBe(stockData.category_id); // Unchanged field

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
                category_id: testCategory.category_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            // Act & Assert
            await expect(stockRepository.update(stockData.isin, { category_id: 'non-existent-category' }))
                .rejects
                .toThrow('Category not found');
        });

        it('should throw an error if updated wkn already exists', async () => {
            // Arrange
            const stock1: Stock = {
                isin: 'TEST123456789',
                category_id: testCategory.category_id,
                name: 'Test Stock 1',
                wkn: 'TEST123',
                symbol: 'TST1'
            };
            const stock2: Stock = {
                isin: 'TEST987654321',
                category_id: testCategory.category_id,
                name: 'Test Stock 2',
                wkn: 'TEST987',
                symbol: 'TST2'
            };
            await prisma.stock.create({ data: stock1 });
            await prisma.stock.create({ data: stock2 });

            // Act & Assert
            await expect(stockRepository.update(stock2.isin, { wkn: stock1.wkn }))
                .rejects
                .toThrow('Stock with this WKN already exists');
        });

        it('should throw an error if updated symbol already exists', async () => {
            // Arrange
            const stock1: Stock = {
                isin: 'TEST123456789',
                category_id: testCategory.category_id,
                name: 'Test Stock 1',
                wkn: 'TEST123',
                symbol: 'TST1'
            };
            const stock2: Stock = {
                isin: 'TEST987654321',
                category_id: testCategory.category_id,
                name: 'Test Stock 2',
                wkn: 'TEST987',
                symbol: 'TST2'
            };
            await prisma.stock.create({ data: stock1 });
            await prisma.stock.create({ data: stock2 });

            // Act & Assert
            await expect(stockRepository.update(stock2.isin, { symbol: stock1.symbol }))
                .rejects
                .toThrow('Stock with this SYMBOL already exists');
        });

        it('should handle unexpected errors during update', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                category_id: testCategory.category_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            // Mock prisma update to throw an unexpected error
            jest.spyOn(prisma.stock, 'update').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(stockRepository.update(stockData.isin, { name: 'New Name' }))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('delete', () => {
        it('should delete a stock', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                category_id: testCategory.category_id,
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

        it('should throw an error if stock has associated holdings', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                category_id: testCategory.category_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            // Create a portfolio
            const portfolio = await prisma.portfolio.create({
                data: {
                    portfolio_id: 'test-portfolio-id',
                    name: 'Test Portfolio',
                    created_at: new Date(),
                    user_id: testUser.user_id
                }
            });

            // Create an associated holding
            await prisma.holding.create({
                data: {
                    holding_id: 'test-holding-id',
                    portfolio_id: portfolio.portfolio_id,
                    isin: stockData.isin,
                    quantity: 100,
                    start_date: new Date(),
                    end_date: null
                }
            });

            // Act & Assert
            await expect(stockRepository.delete(stockData.isin))
                .rejects
                .toThrow('Cannot delete stock with associated holdings');
        });

        it('should handle unexpected errors during deletion', async () => {
            // Arrange
            const stockData: Stock = {
                isin: 'TEST123456789',
                category_id: testCategory.category_id,
                name: 'Test Stock',
                wkn: 'TEST123',
                symbol: 'TST'
            };
            await prisma.stock.create({ data: stockData });

            // Mock prisma delete to throw an unexpected error
            jest.spyOn(prisma.stock, 'delete').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(stockRepository.delete(stockData.isin))
                .rejects
                .toThrow('Unexpected error');
        });
    });
});
