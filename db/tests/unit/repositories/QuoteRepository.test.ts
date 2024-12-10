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
    });
});
