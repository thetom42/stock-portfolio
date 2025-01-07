import { PrismaClient } from '@prisma/client';
import { QuoteRepository } from '../../../src/repositories/QuoteRepository';
import { StockRepository } from '../../../src/repositories/StockRepository';
import { CategoryRepository } from '../../../src/repositories/CategoryRepository';
import { Quote, CreateQuoteInput } from '../../../src/models/Quote';
import { Stock } from '../../../src/models/Stock';
import { Category } from '../../../src/models/Category';
import { getPrismaClient, clearDatabase } from '../../helpers/prisma';
import { Decimal } from '@prisma/client/runtime/library';

describe('QuoteRepository', () => {
    let quoteRepository: QuoteRepository;
    let stockRepository: StockRepository;
    let categoryRepository: CategoryRepository;
    let prisma: PrismaClient;
    let testCategory: Category;
    let testStock: Stock;

    beforeEach(async () => {
        prisma = getPrismaClient();
        quoteRepository = new QuoteRepository(prisma);
        stockRepository = new StockRepository(prisma);
        categoryRepository = new CategoryRepository(prisma);
        await clearDatabase();

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
    });

    describe('create', () => {
        it('should create a new quote', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };

            // Act
            const result = await quoteRepository.create(quoteData);

            // Assert
            expect(result).toBeDefined();
            expect(result.quote_id).toBe(quoteData.quote_id);
            expect(result.price).toEqual(new Decimal(quoteData.price));
            expect(result.currency).toBe(quoteData.currency);

            // Verify the quote was actually saved
            const savedQuote = await prisma.quote.findUnique({
                where: { quote_id: quoteData.quote_id }
            });
            expect(savedQuote).toBeDefined();
            expect(savedQuote?.price).toEqual(new Decimal(quoteData.price));
        });

        it('should throw an error if stock does not exist', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: 'non-existent-isin',
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };

            // Act & Assert
            await expect(quoteRepository.create(quoteData))
                .rejects
                .toThrow('Stock not found');
        });

        it('should throw an error if price is not positive', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 0,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };

            // Act & Assert
            await expect(quoteRepository.create(quoteData))
                .rejects
                .toThrow('Price must be positive');
        });

        it('should throw an error if quote already exists', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            // Act & Assert
            await expect(quoteRepository.create(quoteData))
                .rejects
                .toThrow('Quote already exists');
        });

        it('should handle string price input', async () => {
            // Arrange
            const quoteData = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: '100.50' as any, // Type assertion to bypass TypeScript check
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };

            // Act
            const result = await quoteRepository.create(quoteData);

            // Assert
            expect(result).toBeDefined();
            expect(result.price).toEqual(new Decimal(100.50));
        });

        it('should throw an error if string price is not positive', async () => {
            // Arrange
            const quoteData = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: '0' as any, // Type assertion to bypass TypeScript check
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };

            // Act & Assert
            await expect(quoteRepository.create(quoteData))
                .rejects
                .toThrow('Price must be positive');
        });

        it('should handle non-Error objects during creation', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };

            // Mock prisma create to throw a non-Error object
            jest.spyOn(prisma.quote, 'create').mockRejectedValueOnce('Some string error');

            // Act & Assert
            await expect(quoteRepository.create(quoteData))
                .rejects
                .toBe('Some string error');
        });
    });

    describe('findByIsin', () => {
        it('should find all quotes for a stock', async () => {
            // Arrange
            const quotes: CreateQuoteInput[] = [
                {
                    quote_id: 'quote-1',
                    isin: testStock.isin,
                    price: 100.50,
                    currency: 'USD',
                    market_time: new Date('2024-01-01T10:00:00Z'),
                    exchange: 'NYSE'
                },
                {
                    quote_id: 'quote-2',
                    isin: testStock.isin,
                    price: 101.50,
                    currency: 'USD',
                    market_time: new Date('2024-01-01T11:00:00Z'),
                    exchange: 'NYSE'
                }
            ];
            await Promise.all(quotes.map(quote => quoteRepository.create(quote)));

            // Act
            const result = await quoteRepository.findByIsin(testStock.isin);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].market_time.getTime()).toBeGreaterThan(result[1].market_time.getTime()); // Check descending order
        });

        it('should return empty array when stock has no quotes', async () => {
            // Act
            const result = await quoteRepository.findByIsin(testStock.isin);

            // Assert
            expect(result).toEqual([]);
        });

        it('should handle unexpected errors during find', async () => {
            // Mock prisma findMany to throw an unexpected error
            jest.spyOn(prisma.quote, 'findMany').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(quoteRepository.findByIsin(testStock.isin))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('findLatestByIsin', () => {
        it('should find the latest quote for a stock', async () => {
            // Arrange
            const quotes: CreateQuoteInput[] = [
                {
                    quote_id: 'quote-1',
                    isin: testStock.isin,
                    price: 100.50,
                    currency: 'USD',
                    market_time: new Date('2024-01-01T10:00:00Z'),
                    exchange: 'NYSE'
                },
                {
                    quote_id: 'quote-2',
                    isin: testStock.isin,
                    price: 101.50,
                    currency: 'USD',
                    market_time: new Date('2024-01-01T11:00:00Z'),
                    exchange: 'NYSE'
                }
            ];
            await Promise.all(quotes.map(quote => quoteRepository.create(quote)));

            // Act
            const result = await quoteRepository.findLatestByIsin(testStock.isin);

            // Assert
            expect(result).toBeDefined();
            expect(result?.quote_id).toBe('quote-2');
            expect(result?.price).toEqual(new Decimal(101.50));
        });

        it('should return null when stock has no quotes', async () => {
            // Act
            const result = await quoteRepository.findLatestByIsin(testStock.isin);

            // Assert
            expect(result).toBeNull();
        });

        it('should handle unexpected errors during findLatest', async () => {
            // Mock prisma findFirst to throw an unexpected error
            jest.spyOn(prisma.quote, 'findFirst').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(quoteRepository.findLatestByIsin(testStock.isin))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('update', () => {
        it('should update a quote', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            const updateData = {
                price: 150.75,
                currency: 'EUR'
            };

            // Act
            const result = await quoteRepository.update(quoteData.quote_id, updateData);

            // Assert
            expect(result).toBeDefined();
            expect(result.price).toEqual(new Decimal(updateData.price));
            expect(result.currency).toBe(updateData.currency);
            expect(result.isin).toBe(quoteData.isin); // Unchanged field

            // Verify the update was persisted
            const updatedQuote = await prisma.quote.findUnique({
                where: { quote_id: quoteData.quote_id }
            });
            expect(updatedQuote?.price).toEqual(new Decimal(updateData.price));
            expect(updatedQuote?.currency).toBe(updateData.currency);
        });

        it('should throw an error if quote does not exist', async () => {
            // Act & Assert
            await expect(quoteRepository.update('non-existent-id', { price: 150.75 }))
                .rejects
                .toThrow('Quote not found');
        });

        it('should throw an error if updated price is not positive', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            // Act & Assert
            await expect(quoteRepository.update(quoteData.quote_id, { price: 0 }))
                .rejects
                .toThrow('Price must be positive');
        });

        it('should throw an error if updated stock does not exist', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            // Act & Assert
            await expect(quoteRepository.update(quoteData.quote_id, { isin: 'non-existent-isin' }))
                .rejects
                .toThrow('Stock not found');
        });

        it('should handle Decimal price input during update', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            // Act
            const result = await quoteRepository.update(quoteData.quote_id, { price: new Decimal(150.75) });

            // Assert
            expect(result.price).toEqual(new Decimal(150.75));
        });

        it('should throw an error if updated Decimal price is not positive', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            // Act & Assert
            await expect(quoteRepository.update(quoteData.quote_id, { price: new Decimal(0) }))
                .rejects
                .toThrow('Price must be positive');
        });

        it('should handle unexpected errors during update', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            // Mock prisma update to throw an unexpected error
            jest.spyOn(prisma.quote, 'update').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(quoteRepository.update(quoteData.quote_id, { price: 150.75 }))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('delete', () => {
        it('should delete a quote', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            // Act
            const result = await quoteRepository.delete(quoteData.quote_id);

            // Assert
            expect(result).toBeDefined();
            expect(result.quote_id).toBe(quoteData.quote_id);

            // Verify the quote was actually deleted
            const deletedQuote = await prisma.quote.findUnique({
                where: { quote_id: quoteData.quote_id }
            });
            expect(deletedQuote).toBeNull();
        });

        it('should throw an error if quote does not exist', async () => {
            // Act & Assert
            await expect(quoteRepository.delete('non-existent-id'))
                .rejects
                .toThrow('Quote not found');
        });

        it('should handle unexpected errors during deletion', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                quote_id: 'test-quote-id',
                isin: testStock.isin,
                price: 100.50,
                currency: 'USD',
                market_time: new Date(),
                exchange: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            // Mock prisma delete to throw an unexpected error
            jest.spyOn(prisma.quote, 'delete').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(quoteRepository.delete(quoteData.quote_id))
                .rejects
                .toThrow('Unexpected error');
        });
    });
});
