import { Router } from 'express';
import { protect } from '../config/keycloak';
import * as userController from '../controllers/userController';
import { validateUserCreation, validateUserUpdate } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/', validateUserCreation, userController.createUser);

// Protected routes
router.get('/:id', protect(), userController.getUser);
router.put('/:id', protect(), validateUserUpdate, userController.updateUser);
router.delete('/:id', protect(), userController.deleteUser);

// Get user's own profile
router.get('/profile/me', protect(), userController.getOwnProfile);
router.put('/profile/me', protect(), validateUserUpdate, userController.updateOwnProfile);

export default router;
