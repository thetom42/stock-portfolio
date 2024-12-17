import { Category, CreateCategoryDTO, UpdateCategoryDTO, CategoryResponse } from '../models/Category';
import { CategoryRepository } from '@stock-portfolio/db';
import { getPrismaClient } from '../utils/database';

// Helper function to map DB Category to BFF Category
const mapDBCategoryToBFF = (dbCategory: any): CategoryResponse => ({
  id: dbCategory.category_id, // Map from DB's category_id to BFF's id
  name: dbCategory.name
});

// Repository factory
let categoryRepository: CategoryRepository;

export const getCategoryRepository = () => {
  if (!categoryRepository) {
    categoryRepository = new CategoryRepository(getPrismaClient());
  }
  return categoryRepository;
};

// For testing purposes
export const setCategoryRepository = (repo: CategoryRepository) => {
  categoryRepository = repo;
};

export const createCategory = async (categoryData: CreateCategoryDTO): Promise<CategoryResponse> => {
  try {
    const dbCategory = await getCategoryRepository().create({
      category_id: '', // Will be generated
      name: categoryData.name
    });

    return mapDBCategoryToBFF(dbCategory);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw new Error('Category with this name already exists');
    }
    throw error;
  }
};

export const getCategoryById = async (categoryId: string): Promise<CategoryResponse | null> => {
  const category = await getCategoryRepository().findById(categoryId);

  if (!category) {
    return null;
  }

  return mapDBCategoryToBFF(category);
};

export const getAllCategories = async (): Promise<CategoryResponse[]> => {
  const categories = await getCategoryRepository().findAll();
  return categories.map(mapDBCategoryToBFF);
};

export const updateCategory = async (
  categoryId: string,
  updateData: UpdateCategoryDTO
): Promise<CategoryResponse> => {
  try {
    const updatedCategory = await getCategoryRepository().update(categoryId, {
      name: updateData.name
    });

    return mapDBCategoryToBFF(updatedCategory);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new Error('Category not found');
      }
      if (error.message.includes('already exists')) {
        throw new Error('Category with this name already exists');
      }
    }
    throw new Error('Failed to update category');
  }
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    await getCategoryRepository().delete(categoryId);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new Error('Category not found');
      }
    }
    throw new Error('Failed to delete category');
  }
};
