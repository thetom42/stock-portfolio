import { PrismaClient } from '@prisma/client';
import { CategoryRepository } from '../../../repositories/CategoryRepository';
import { Category } from '../../../models/Category';
import { getPrismaClient, clearDatabase } from '../../helpers/prisma';

describe('CategoryRepository', () => {
    let categoryRepository: CategoryRepository;
    let prisma: PrismaClient;

    beforeEach(async () => {
        prisma = getPrismaClient();
        categoryRepository = new CategoryRepository(prisma);
        await clearDatabase();
    });

    describe('create', () => {
        it('should create a new category', async () => {
            // Arrange
            const categoryData: Category = {
                CATEGORIES_ID: 'test-category-id',
                NAME: 'Test Category'
            };

            // Act
            const result = await categoryRepository.create(categoryData);

            // Assert
            expect(result).toBeDefined();
            expect(result.CATEGORIES_ID).toBe(categoryData.CATEGORIES_ID);
            expect(result.NAME).toBe(categoryData.NAME);

            // Verify the category was actually saved
            const savedCategory = await prisma.category.findUnique({
                where: { CATEGORIES_ID: categoryData.CATEGORIES_ID }
            });
            expect(savedCategory).toBeDefined();
            expect(savedCategory?.NAME).toBe(categoryData.NAME);
        });

        it('should throw an error if category name already exists', async () => {
            // Arrange
            const categoryData: Category = {
                CATEGORIES_ID: 'test-category-id',
                NAME: 'Test Category'
            };
            await categoryRepository.create(categoryData);

            // Act & Assert
            const duplicateCategory = { ...categoryData, CATEGORIES_ID: 'different-id' };
            await expect(categoryRepository.create(duplicateCategory))
                .rejects
                .toThrow('Category with this name already exists');
        });
    });

    describe('findById', () => {
        it('should find a category by ID', async () => {
            // Arrange
            const categoryData: Category = {
                CATEGORIES_ID: 'test-category-id',
                NAME: 'Test Category'
            };
            await prisma.category.create({ data: categoryData });

            // Act
            const result = await categoryRepository.findById(categoryData.CATEGORIES_ID);

            // Assert
            expect(result).toBeDefined();
            expect(result?.CATEGORIES_ID).toBe(categoryData.CATEGORIES_ID);
            expect(result?.NAME).toBe(categoryData.NAME);
        });

        it('should return null if category is not found', async () => {
            // Act
            const result = await categoryRepository.findById('non-existent-id');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findByName', () => {
        it('should find a category by name', async () => {
            // Arrange
            const categoryData: Category = {
                CATEGORIES_ID: 'test-category-id',
                NAME: 'Test Category'
            };
            await prisma.category.create({ data: categoryData });

            // Act
            const result = await categoryRepository.findByName(categoryData.NAME);

            // Assert
            expect(result).toBeDefined();
            expect(result?.CATEGORIES_ID).toBe(categoryData.CATEGORIES_ID);
            expect(result?.NAME).toBe(categoryData.NAME);
        });

        it('should return null if category is not found', async () => {
            // Act
            const result = await categoryRepository.findByName('non-existent-name');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return all categories', async () => {
            // Arrange
            const categories = [
                { CATEGORIES_ID: 'id-1', NAME: 'Category 1' },
                { CATEGORIES_ID: 'id-2', NAME: 'Category 2' },
                { CATEGORIES_ID: 'id-3', NAME: 'Category 3' }
            ];
            await Promise.all(categories.map(category => 
                prisma.category.create({ data: category })
            ));

            // Act
            const result = await categoryRepository.findAll();

            // Assert
            expect(result).toHaveLength(3);
            expect(result).toEqual(expect.arrayContaining(
                categories.map(category => expect.objectContaining(category))
            ));
        });

        it('should return empty array when no categories exist', async () => {
            // Act
            const result = await categoryRepository.findAll();

            // Assert
            expect(result).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update a category', async () => {
            // Arrange
            const categoryData: Category = {
                CATEGORIES_ID: 'test-category-id',
                NAME: 'Test Category'
            };
            await prisma.category.create({ data: categoryData });

            const updateData = {
                NAME: 'Updated Category Name'
            };

            // Act
            const result = await categoryRepository.update(categoryData.CATEGORIES_ID, updateData);

            // Assert
            expect(result).toBeDefined();
            expect(result.NAME).toBe(updateData.NAME);

            // Verify the update was persisted
            const updatedCategory = await prisma.category.findUnique({
                where: { CATEGORIES_ID: categoryData.CATEGORIES_ID }
            });
            expect(updatedCategory?.NAME).toBe(updateData.NAME);
        });

        it('should throw an error if category does not exist', async () => {
            // Act & Assert
            await expect(categoryRepository.update('non-existent-id', { NAME: 'New Name' }))
                .rejects
                .toThrow('Category not found');
        });

        it('should throw an error if updated name already exists', async () => {
            // Arrange
            const category1 = {
                CATEGORIES_ID: 'id-1',
                NAME: 'Category 1'
            };
            const category2 = {
                CATEGORIES_ID: 'id-2',
                NAME: 'Category 2'
            };
            await prisma.category.create({ data: category1 });
            await prisma.category.create({ data: category2 });

            // Act & Assert
            await expect(categoryRepository.update(category2.CATEGORIES_ID, { NAME: category1.NAME }))
                .rejects
                .toThrow('Category with this name already exists');
        });
    });

    describe('delete', () => {
        it('should delete a category', async () => {
            // Arrange
            const categoryData: Category = {
                CATEGORIES_ID: 'test-category-id',
                NAME: 'Test Category'
            };
            await prisma.category.create({ data: categoryData });

            // Act
            const result = await categoryRepository.delete(categoryData.CATEGORIES_ID);

            // Assert
            expect(result).toBeDefined();
            expect(result.CATEGORIES_ID).toBe(categoryData.CATEGORIES_ID);

            // Verify the category was actually deleted
            const deletedCategory = await prisma.category.findUnique({
                where: { CATEGORIES_ID: categoryData.CATEGORIES_ID }
            });
            expect(deletedCategory).toBeNull();
        });

        it('should throw an error if category does not exist', async () => {
            // Act & Assert
            await expect(categoryRepository.delete('non-existent-id'))
                .rejects
                .toThrow('Category not found');
        });
    });
});
