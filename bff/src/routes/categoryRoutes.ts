import express from 'express';
import { protect } from '../config/keycloak';
import * as categoryController from '../controllers/categoryController';
import { validateCategoryCreation, validateCategoryUpdate, validateUUID } from '../middleware/validation';

const router = express.Router();

// Read operations require basic authentication
router.get('/', protect(), categoryController.getAllCategories);
router.get('/:id', protect(), validateUUID('id'), categoryController.getCategoryById);

// Write operations require admin role
router.post('/', protect('admin'), validateCategoryCreation, categoryController.createCategory);
router.put('/:id', protect('admin'), validateUUID('id'), validateCategoryUpdate, categoryController.updateCategory);
router.delete('/:id', protect('admin'), validateUUID('id'), categoryController.deleteCategory);

export default router;
