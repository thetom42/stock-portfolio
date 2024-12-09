import { PrismaClient } from '@prisma/client';
import { Category } from '../models/Category';

export class CategoryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(category: Category): Promise<Category> {
    try {
      return await this.prisma.category.create({
        data: category
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new Error('Category already exists');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Category | null> {
    return await this.prisma.category.findUnique({
      where: { categories_id: id }
    });
  }

  async findAll(): Promise<Category[]> {
    return await this.prisma.category.findMany();
  }

  async update(id: string, categoryData: Partial<Category>): Promise<Category> {
    try {
      const existingCategory = await this.findById(id);
      if (!existingCategory) {
        throw new Error('Category not found');
      }

      return await this.prisma.category.update({
        where: { categories_id: id },
        data: categoryData
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new Error('Category not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<Category> {
    try {
      return await this.prisma.category.delete({
        where: { categories_id: id }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new Error('Category not found');
      }
      throw error;
    }
  }
}
