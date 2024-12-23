import { Category, CreateCategoryDTO, UpdateCategoryDTO, CategoryResponse } from '../models/Category';
import { CategoryRepository } from '@stock-portfolio/db';
import { getPrismaClient } from '../utils/database';

// Helper function to map DB Category to BFF Category
const mapDBCategoryToBFF = (dbCategory: any): CategoryResponse => ({
  id: dbCategory.category_id, // Map from DB's category_id to BFF's id
  name: dbCategory.name
});

class CategoryService {
  private repository: CategoryRepository;
  private static instance: CategoryService;

  private constructor() {
    this.repository = new CategoryRepository(getPrismaClient());
  }

  static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }
    return CategoryService.instance;
  }

  // For testing purposes
  setRepository(repo: CategoryRepository): void {
    this.repository = repo;
  }

  async createCategory(categoryData: CreateCategoryDTO): Promise<CategoryResponse> {
    try {
      const dbCategory = await this.repository.create({
        category_id: '', // Will be generated
        name: categoryData.name
      });

      return mapDBCategoryToBFF(dbCategory);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        throw new Error('Category with this name already exists');
      }
      throw new Error('Failed to create category');
    }
  }

  async getCategoryById(categoryId: string): Promise<CategoryResponse | null> {
    try {
      const category = await this.repository.findById(categoryId);

      if (!category) {
        return null;
      }

      return mapDBCategoryToBFF(category);
    } catch (error) {
      throw new Error('Failed to fetch category');
    }
  }

  async getAllCategories(): Promise<CategoryResponse[]> {
    try {
      const categories = await this.repository.findAll();
      return categories.map(mapDBCategoryToBFF);
    } catch (error) {
      throw new Error('Failed to fetch categories');
    }
  }

  async updateCategory(
    categoryId: string,
    updateData: UpdateCategoryDTO
  ): Promise<CategoryResponse | null> {
    try {
      const updatedCategory = await this.repository.update(categoryId, {
        name: updateData.name
      });

      if (!updatedCategory) {
        return null;
      }

      return mapDBCategoryToBFF(updatedCategory);
    } catch (error) {
      throw new Error('Failed to update category');
    }
  }

  async deleteCategory(categoryId: string): Promise<CategoryResponse> {
    try {
      const deletedCategory = await this.repository.delete(categoryId);
      return mapDBCategoryToBFF(deletedCategory);
    } catch (error) {
      throw new Error('Failed to delete category');
    }
  }
}

// Export singleton instance
export const categoryService = CategoryService.getInstance();

// For testing purposes
export const setCategoryRepository = (repo: CategoryRepository) => {
  categoryService.setRepository(repo);
  return categoryService;
};
