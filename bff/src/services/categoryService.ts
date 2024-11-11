import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../models/Category';
import { getCategoryRepository } from '../utils/database';

// Helper function to map DB Category to BFF Category
const mapDBCategoryToBFF = (dbCategory: any): Category => ({
    CATEGORIES_ID: dbCategory.CATEGORIES_ID,
    NAME: dbCategory.NAME
});

export const createCategory = async (categoryData: CreateCategoryDTO): Promise<Category> => {
    const categoryRepo = getCategoryRepository();
    const existingCategory = await categoryRepo.findByName(categoryData.NAME);
    
    if (existingCategory) {
        throw new Error('Category with this name already exists');
    }

    const dbCategory = await categoryRepo.create({
        CATEGORIES_ID: '', // Will be generated
        NAME: categoryData.NAME
    });

    return mapDBCategoryToBFF(dbCategory);
};

export const getCategoryById = async (id: string): Promise<Category | null> => {
    const categoryRepo = getCategoryRepository();
    const category = await categoryRepo.findById(id);
    
    if (!category) {
        return null;
    }

    return mapDBCategoryToBFF(category);
};

export const getAllCategories = async (): Promise<Category[]> => {
    const categoryRepo = getCategoryRepository();
    const categories = await categoryRepo.findAll();
    return categories.map(mapDBCategoryToBFF);
};

export const updateCategory = async (
    id: string,
    updateData: UpdateCategoryDTO
): Promise<Category> => {
    const categoryRepo = getCategoryRepository();
    
    const category = await categoryRepo.findById(id);
    if (!category) {
        throw new Error('Category not found');
    }

    if (updateData.NAME) {
        const existingCategory = await categoryRepo.findByName(updateData.NAME);
        if (existingCategory && existingCategory.CATEGORIES_ID !== id) {
            throw new Error('Category with this name already exists');
        }
    }

    const updatedCategory = await categoryRepo.update(id, {
        NAME: updateData.NAME || category.NAME
    });

    return mapDBCategoryToBFF(updatedCategory);
};

export const deleteCategory = async (id: string): Promise<void> => {
    const categoryRepo = getCategoryRepository();
    
    const category = await categoryRepo.findById(id);
    if (!category) {
        throw new Error('Category not found');
    }

    await categoryRepo.delete(id);
};
