import { PrismaClient } from '@prisma/client';
import { Category } from '../models/Category';

export class CategoryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(category: Category): Promise<Category> {
    try {
      // Check if category with same name exists
      const existingCategory = await this.prisma.category.findFirst({
        where: { name: category.name }
      });
      if (existingCategory) {
        throw new Error('Category with this name already exists');
      }

      return await this.prisma.category.create({
        data: category
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Category with this name already exists') {
          throw error;
        }
        throw error;
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({
      where: { category_id: id }
    });
  }

  async findAll(): Promise<Category[]> {
    return await this.prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    });
  }

  async update(id: string, categoryData: Partial<Category>): Promise<Category> {
    try {
      const existingCategory = await this.findById(id);
      if (!existingCategory) {
        throw new Error('Category not found');
      }

      // Check if updated name already exists
      if (categoryData.name) {
        const categoryWithSameName = await this.prisma.category.findFirst({
          where: { 
            name: categoryData.name,
            category_id: { not: id }
          }
        });
        if (categoryWithSameName) {
          throw new Error('Category with this name already exists');
        }
      }

      return await this.prisma.category.update({
        where: { category_id: id },
        data: categoryData
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Category not found' ||
            error.message === 'Category with this name already exists') {
          throw error;
        }
        throw error;
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Category> {
    try {
      // Check if category has any stocks
      const stocks = await this.prisma.stock.findMany({
        where: { category_id: id }
      });

      if (stocks.length > 0) {
        throw new Error('Cannot delete category with associated stocks');
      }

      return await this.prisma.category.delete({
        where: { category_id: id }
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Cannot delete category with associated stocks') {
          throw error;
        }
        if (error.message.includes('Record to delete does not exist')) {
          throw new Error('Category not found');
        }
        throw error;
      }
      throw error;
    }
  }
}
