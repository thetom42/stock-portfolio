import { PrismaClient } from '@prisma/client';
import { Category } from '../models/Category';

export class CategoryRepository {
    constructor(private prisma: PrismaClient) {}

    async create(category: Category): Promise<Category> {
        const existingCategory = await this.findByName(category.NAME);
        if (existingCategory) {
            throw new Error('Category with this name already exists');
        }

        return this.prisma.category.create({
            data: category
        });
    }

    async findById(id: string): Promise<Category | null> {
        return this.prisma.category.findUnique({
            where: { CATEGORIES_ID: id }
        });
    }

    async findByName(name: string): Promise<Category | null> {
        return this.prisma.category.findFirst({
            where: { NAME: name }
        });
    }

    async findAll(): Promise<Category[]> {
        return this.prisma.category.findMany();
    }

    async update(id: string, data: Partial<Category>): Promise<Category> {
        const category = await this.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }

        if (data.NAME) {
            const existingCategory = await this.findByName(data.NAME);
            if (existingCategory && existingCategory.CATEGORIES_ID !== id) {
                throw new Error('Category with this name already exists');
            }
        }

        return this.prisma.category.update({
            where: { CATEGORIES_ID: id },
            data
        });
    }

    async delete(id: string): Promise<Category> {
        const category = await this.findById(id);
        if (!category) {
            throw new Error('Category not found');
        }

        return this.prisma.category.delete({
            where: { CATEGORIES_ID: id }
        });
    }
}
