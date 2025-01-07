import { PrismaClient } from '@prisma/client';
import { CategoryRepository } from '../../../src/repositories/CategoryRepository';
import { Category } from '../../../src/models/Category';
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
                category_id: 'test-category-id',
                name: 'Test Category'
            };

            // Act
            const result = await categoryRepository.create(categoryData);

            // Assert
            expect(result).toBeDefined();
            expect(result.category_id).toBe(categoryData.category_id);
            expect(result.name).toBe(categoryData.name);

            // Verify the category was actually saved
            const savedCategory = await prisma.category.findUnique({
                where: { category_id: categoryData.category_id }
            });
            expect(savedCategory).toBeDefined();
            expect(savedCategory?.name).toBe(categoryData.name);
        });

        it('should throw an error if category name already exists', async () => {
            // Arrange
            const categoryData: Category = {
                category_id: 'test-category-id',
                name: 'Test Category'
            };
            await categoryRepository.create(categoryData);

            // Act & Assert
            const duplicateCategory = { ...categoryData, category_id: 'different-id' };
            await expect(categoryRepository.create(duplicateCategory))
                .rejects
                .toThrow('Category with this name already exists');
        });

        it('should handle unexpected errors during creation', async () => {
            // Arrange
            const categoryData: Category = {
                category_id: 'test-category-id',
                name: 'Test Category'
            };

            // Mock prisma create to throw an unexpected error
            jest.spyOn(prisma.category, 'create').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(categoryRepository.create(categoryData))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('findById', () => {
        it('should find a category by ID', async () => {
            // Arrange
            const categoryData: Category = {
                category_id: 'test-category-id',
                name: 'Test Category'
            };
            await prisma.category.create({ data: categoryData });

            // Act
            const result = await categoryRepository.findById(categoryData.category_id);

            // Assert
            expect(result).toBeDefined();
            expect(result?.category_id).toBe(categoryData.category_id);
            expect(result?.name).toBe(categoryData.name);
        });

        it('should return null if category is not found', async () => {
            // Act
            const result = await categoryRepository.findById('non-existent-id');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('findAll', () => {
        it('should return all categories', async () => {
            // Arrange
            const categories = [
                { category_id: 'id-1', name: 'Category 1' },
                { category_id: 'id-2', name: 'Category 2' },
                { category_id: 'id-3', name: 'Category 3' }
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

        it('should return categories in ascending order by name', async () => {
            // Arrange
            const categories = [
                { category_id: 'id-3', name: 'Category C' },
                { category_id: 'id-1', name: 'Category A' },
                { category_id: 'id-2', name: 'Category B' }
            ];
            await Promise.all(categories.map(category =>
                prisma.category.create({ data: category })
            ));

            // Act
            const result = await categoryRepository.findAll();

            // Assert
            expect(result).toHaveLength(3);
            expect(result[0].name).toBe('Category A');
            expect(result[1].name).toBe('Category B');
            expect(result[2].name).toBe('Category C');
        });
    });

    describe('update', () => {
        it('should update a category', async () => {
            // Arrange
            const categoryData: Category = {
                category_id: 'test-category-id',
                name: 'Test Category'
            };
            await prisma.category.create({ data: categoryData });

            const updateData = {
                name: 'Updated Category Name'
            };

            // Act
            const result = await categoryRepository.update(categoryData.category_id, updateData);

            // Assert
            expect(result).toBeDefined();
            expect(result.name).toBe(updateData.name);

            // Verify the update was persisted
            const updatedCategory = await prisma.category.findUnique({
                where: { category_id: categoryData.category_id }
            });
            expect(updatedCategory?.name).toBe(updateData.name);
        });

        it('should throw an error if category does not exist', async () => {
            // Act & Assert
            await expect(categoryRepository.update('non-existent-id', { name: 'New Name' }))
                .rejects
                .toThrow('Category not found');
        });

        it('should throw an error if updated name already exists', async () => {
            // Arrange
            const category1 = {
                category_id: 'id-1',
                name: 'Category 1'
            };
            const category2 = {
                category_id: 'id-2',
                name: 'Category 2'
            };
            await prisma.category.create({ data: category1 });
            await prisma.category.create({ data: category2 });

            // Act & Assert
            await expect(categoryRepository.update(category2.category_id, { name: category1.name }))
                .rejects
                .toThrow('Category with this name already exists');
        });

        it('should handle unexpected errors during update', async () => {
            // Arrange
            const categoryData: Category = {
                category_id: 'test-category-id',
                name: 'Test Category'
            };
            await prisma.category.create({ data: categoryData });

            // Mock prisma update to throw an unexpected error
            jest.spyOn(prisma.category, 'update').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(categoryRepository.update(categoryData.category_id, { name: 'New Name' }))
                .rejects
                .toThrow('Unexpected error');
        });
    });

    describe('delete', () => {
        it('should delete a category', async () => {
            // Arrange
            const categoryData: Category = {
                category_id: 'test-category-id',
                name: 'Test Category'
            };
            await prisma.category.create({ data: categoryData });

            // Act
            const result = await categoryRepository.delete(categoryData.category_id);

            // Assert
            expect(result).toBeDefined();
            expect(result.category_id).toBe(categoryData.category_id);

            // Verify the category was actually deleted
            const deletedCategory = await prisma.category.findUnique({
                where: { category_id: categoryData.category_id }
            });
            expect(deletedCategory).toBeNull();
        });

        it('should throw an error if category does not exist', async () => {
            // Act & Assert
            await expect(categoryRepository.delete('non-existent-id'))
                .rejects
                .toThrow('Category not found');
        });

        it('should throw an error if category has associated stocks', async () => {
            // Arrange
            const categoryData: Category = {
                category_id: 'test-category-id',
                name: 'Test Category'
            };
            await prisma.category.create({ data: categoryData });

            // Create an associated stock
            await prisma.stock.create({
                data: {
                    isin: 'TEST123456789',
                    name: 'Test Stock',
                    symbol: 'TST',
                    wkn: 'TEST123',
                    category_id: categoryData.category_id
                }
            });

            // Act & Assert
            await expect(categoryRepository.delete(categoryData.category_id))
                .rejects
                .toThrow('Cannot delete category with associated stocks');
        });

        it('should handle unexpected errors during deletion', async () => {
            // Arrange
            const categoryData: Category = {
                category_id: 'test-category-id',
                name: 'Test Category'
            };
            await prisma.category.create({ data: categoryData });

            // Mock prisma delete to throw an unexpected error
            jest.spyOn(prisma.category, 'delete').mockRejectedValueOnce(new Error('Unexpected error'));

            // Act & Assert
            await expect(categoryRepository.delete(categoryData.category_id))
                .rejects
                .toThrow('Unexpected error');
        });
    });
});
