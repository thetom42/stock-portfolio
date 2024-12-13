import { PrismaClient } from '@prisma/client';
import { Category } from '../models/Category';
export declare class CategoryRepository {
    private prisma;
    constructor(prisma: PrismaClient);
    create(category: Category): Promise<Category>;
    findById(id: string): Promise<Category | null>;
    findAll(): Promise<Category[]>;
    update(id: string, categoryData: Partial<Category>): Promise<Category>;
    delete(id: string): Promise<Category>;
}
