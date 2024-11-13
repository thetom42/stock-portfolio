import { protect } from '../config/keycloak';
import * as categoryController from '../controllers/categoryController';
import { validateCategoryCreation, validateCategoryUpdate, validateUUID } from '../middleware/validation';

import express = require('express');
const router = express.Router();

// All category routes require authentication
router.use(protect());

// Category routes
router.post('/', validateCategoryCreation, categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.get('/:id', validateUUID('id'), categoryController.getCategoryById);
router.put('/:id', validateUUID('id'), validateCategoryUpdate, categoryController.updateCategory);
router.delete('/:id', validateUUID('id'), categoryController.deleteCategory);

export default router;
