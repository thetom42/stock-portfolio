import type { Request, Response, NextFunction } from 'express-serve-static-core';
import { Category } from '../../../db/models/Category';
import * as categoryService from '../services/categoryService';

export const createCategory = async (
    req: Request<{}, {}, Category>,
    res: Response,
    next: NextFunction
) => {
    try {
        const category = await categoryService.createCategory(req.body);
        res.status(201).json({ category });
    } catch (error) {
        if (error instanceof Error && error.message === 'Category name already exists') {
            res.status(409).json({ error: error.message });
        } else {
            next(error);
        }
    }
};

export const getCategoryById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
) => {
    try {
        const category = await categoryService.getCategoryById(req.params.id);
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        res.json({ category });
    } catch (error) {
        next(error);
    }
};

export const getAllCategories = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const categories = await categoryService.getAllCategories();
        res.json({ categories });
    } catch (error) {
        next(error);
    }
};

export const updateCategory = async (
    req: Request<{ id: string }, {}, Partial<Category>>,
    res: Response,
    next: NextFunction
) => {
    try {
        const category = await categoryService.updateCategory(req.params.id, req.body);
        res.json({ category });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message === 'Category not found') {
                res.status(404).json({ error: error.message });
            } else if (error.message === 'Category name already exists') {
                res.status(409).json({ error: error.message });
            } else {
                next(error);
            }
        }
    }
};

export const deleteCategory = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        res.status(204).send();
    } catch (error) {
        if (error instanceof Error && error.message === 'Category not found') {
            res.status(404).json({ error: error.message });
        } else {
            next(error);
        }
    }
};
