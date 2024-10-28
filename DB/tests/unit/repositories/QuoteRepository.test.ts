import { PrismaClient } from '@prisma/client';
import { QuoteRepository } from '../../../repositories/QuoteRepository';
import { StockRepository } from '../../../repositories/StockRepository';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { Quote, CreateQuoteInput } from '../../../models/Quote';
import { Stock } from '../../../models/Stock';
import { Category } from '../../../models/Category';
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
    });

    describe('create', () => {
        it('should create a new quote', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                QUOTES_ID: 'test-quote-id',
                ISIN: testStock.ISIN,
                PRICE: 100.50,
                CURRENCY: 'USD',
                MARKET_TIME: new Date(),
                EXCHANGE: 'NYSE'
            };

            // Act
            const result = await quoteRepository.create(quoteData);

            // Assert
            expect(result).toBeDefined();
            expect(result.QUOTES_ID).toBe(quoteData.QUOTES_ID);
            expect(result.PRICE).toEqual(new Decimal(quoteData.PRICE));
            expect(result.CURRENCY).toBe(quoteData.CURRENCY);

            // Verify the quote was actually saved
            const savedQuote = await prisma.quote.findUnique({
                where: { QUOTES_ID: quoteData.QUOTES_ID }
            });
            expect(savedQuote).toBeDefined();
            expect(savedQuote?.PRICE).toEqual(new Decimal(quoteData.PRICE));
        });

        it('should throw an error if stock does not exist', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                QUOTES_ID: 'test-quote-id',
                ISIN: 'non-existent-isin',
                PRICE: 100.50,
                CURRENCY: 'USD',
                MARKET_TIME: new Date(),
                EXCHANGE: 'NYSE'
            };

            // Act & Assert
            await expect(quoteRepository.create(quoteData))
                .rejects
                .toThrow('Stock not found');
        });
    });

    describe('findByStock', () => {
        it('should find all quotes for a stock', async () => {
            // Arrange
            const quotes: CreateQuoteInput[] = [
                {
                    QUOTES_ID: 'quote-1',
                    ISIN: testStock.ISIN,
                    PRICE: 100.50,
                    CURRENCY: 'USD',
                    MARKET_TIME: new Date('2024-01-01T10:00:00Z'),
                    EXCHANGE: 'NYSE'
                },
                {
                    QUOTES_ID: 'quote-2',
                    ISIN: testStock.ISIN,
                    PRICE: 101.50,
                    CURRENCY: 'USD',
                    MARKET_TIME: new Date('2024-01-01T11:00:00Z'),
                    EXCHANGE: 'NYSE'
                }
            ];
            await Promise.all(quotes.map(quote => quoteRepository.create(quote)));

            // Act
            const result = await quoteRepository.findByStock(testStock.ISIN);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].MARKET_TIME.getTime()).toBeGreaterThan(result[1].MARKET_TIME.getTime()); // Check descending order
        });

        it('should return empty array when stock has no quotes', async () => {
            // Act
            const result = await quoteRepository.findByStock(testStock.ISIN);

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('findLatestByStock', () => {
        it('should find the latest quote for a stock', async () => {
            // Arrange
            const quotes: CreateQuoteInput[] = [
                {
                    QUOTES_ID: 'quote-1',
                    ISIN: testStock.ISIN,
                    PRICE: 100.50,
                    CURRENCY: 'USD',
                    MARKET_TIME: new Date('2024-01-01T10:00:00Z'),
                    EXCHANGE: 'NYSE'
                },
                {
                    QUOTES_ID: 'quote-2',
                    ISIN: testStock.ISIN,
                    PRICE: 101.50,
                    CURRENCY: 'USD',
                    MARKET_TIME: new Date('2024-01-01T11:00:00Z'),
                    EXCHANGE: 'NYSE'
                }
            ];
            await Promise.all(quotes.map(quote => quoteRepository.create(quote)));

            // Act
            const result = await quoteRepository.findLatestByStock(testStock.ISIN);

            // Assert
            expect(result).toBeDefined();
            expect(result?.QUOTES_ID).toBe('quote-2');
            expect(result?.PRICE).toEqual(new Decimal(101.50));
        });

        it('should return null when stock has no quotes', async () => {
            // Act
            const result = await quoteRepository.findLatestByStock(testStock.ISIN);

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findByStockAndTimeRange', () => {
        it('should find quotes within time range', async () => {
            // Arrange
            const quotes: CreateQuoteInput[] = [
                {
                    QUOTES_ID: 'quote-1',
                    ISIN: testStock.ISIN,
                    PRICE: 100.50,
                    CURRENCY: 'USD',
                    MARKET_TIME: new Date('2024-01-01T10:00:00Z'),
                    EXCHANGE: 'NYSE'
                },
                {
                    QUOTES_ID: 'quote-2',
                    ISIN: testStock.ISIN,
                    PRICE: 101.50,
                    CURRENCY: 'USD',
                    MARKET_TIME: new Date('2024-01-01T11:00:00Z'),
                    EXCHANGE: 'NYSE'
                },
                {
                    QUOTES_ID: 'quote-3',
                    ISIN: testStock.ISIN,
                    PRICE: 102.50,
                    CURRENCY: 'USD',
                    MARKET_TIME: new Date('2024-01-01T12:00:00Z'),
                    EXCHANGE: 'NYSE'
                }
            ];
            await Promise.all(quotes.map(quote => quoteRepository.create(quote)));

            // Act
            const result = await quoteRepository.findByStockAndTimeRange(
                testStock.ISIN,
                new Date('2024-01-01T10:30:00Z'),
                new Date('2024-01-01T11:30:00Z')
            );

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].QUOTES_ID).toBe('quote-2');
        });
    });

    describe('update', () => {
        it('should update a quote', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                QUOTES_ID: 'test-quote-id',
                ISIN: testStock.ISIN,
                PRICE: 100.50,
                CURRENCY: 'USD',
                MARKET_TIME: new Date(),
                EXCHANGE: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            const updateData = {
                PRICE: 150.75,
                CURRENCY: 'EUR'
            };

            // Act
            const result = await quoteRepository.update(quoteData.QUOTES_ID, updateData);

            // Assert
            expect(result).toBeDefined();
            expect(result.PRICE).toEqual(new Decimal(updateData.PRICE));
            expect(result.CURRENCY).toBe(updateData.CURRENCY);
            expect(result.ISIN).toBe(quoteData.ISIN); // Unchanged field

            // Verify the update was persisted
            const updatedQuote = await prisma.quote.findUnique({
                where: { QUOTES_ID: quoteData.QUOTES_ID }
            });
            expect(updatedQuote?.PRICE).toEqual(new Decimal(updateData.PRICE));
            expect(updatedQuote?.CURRENCY).toBe(updateData.CURRENCY);
        });

        it('should throw an error if quote does not exist', async () => {
            // Act & Assert
            await expect(quoteRepository.update('non-existent-id', { PRICE: 150.75 }))
                .rejects
                .toThrow('Quote not found');
        });
    });

    describe('delete', () => {
        it('should delete a quote', async () => {
            // Arrange
            const quoteData: CreateQuoteInput = {
                QUOTES_ID: 'test-quote-id',
                ISIN: testStock.ISIN,
                PRICE: 100.50,
                CURRENCY: 'USD',
                MARKET_TIME: new Date(),
                EXCHANGE: 'NYSE'
            };
            await quoteRepository.create(quoteData);

            // Act
            const result = await quoteRepository.delete(quoteData.QUOTES_ID);

            // Assert
            expect(result).toBeDefined();
            expect(result.QUOTES_ID).toBe(quoteData.QUOTES_ID);

            // Verify the quote was actually deleted
            const deletedQuote = await prisma.quote.findUnique({
                where: { QUOTES_ID: quoteData.QUOTES_ID }
            });
            expect(deletedQuote).toBeNull();
        });

        it('should throw an error if quote does not exist', async () => {
            // Act & Assert
            await expect(quoteRepository.delete('non-existent-id'))
                .rejects
                .toThrow('Quote not found');
        });
    });

    describe('deleteByTimeRange', () => {
        it('should delete quotes within time range', async () => {
            // Arrange
            const quotes: CreateQuoteInput[] = [
                {
                    QUOTES_ID: 'quote-1',
                    ISIN: testStock.ISIN,
                    PRICE: 100.50,
                    CURRENCY: 'USD',
                    MARKET_TIME: new Date('2024-01-01T10:00:00Z'),
                    EXCHANGE: 'NYSE'
                },
                {
                    QUOTES_ID: 'quote-2',
                    ISIN: testStock.ISIN,
                    PRICE: 101.50,
                    CURRENCY: 'USD',
                    MARKET_TIME: new Date('2024-01-01T11:00:00Z'),
                    EXCHANGE: 'NYSE'
                },
                {
                    QUOTES_ID: 'quote-3',
                    ISIN: testStock.ISIN,
                    PRICE: 102.50,
                    CURRENCY: 'USD',
                    MARKET_TIME: new Date('2024-01-01T12:00:00Z'),
                    EXCHANGE: 'NYSE'
                }
            ];
            await Promise.all(quotes.map(quote => quoteRepository.create(quote)));

            // Act
            const deletedCount = await quoteRepository.deleteByTimeRange(
                new Date('2024-01-01T10:30:00Z'),
                new Date('2024-01-01T11:30:00Z')
            );

            // Assert
            expect(deletedCount).toBe(1);
            const remainingQuotes = await quoteRepository.findByStock(testStock.ISIN);
            expect(remainingQuotes).toHaveLength(2);
        });
    });
});
