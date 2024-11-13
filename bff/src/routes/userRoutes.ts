import { protect } from '../config/keycloak';
import * as userController from '../controllers/userController';
import { validateUserCreation, validateUserUpdate, validateUUID } from '../middleware/validation';
import type { Request, Response, NextFunction } from 'express-serve-static-core';
import { AuthenticatedRequest } from '../types/express';
import { CreateUserDTO, UpdateUserDTO } from '../models/User';

import * as express from 'express';
const router = express.Router();

// Public routes
router.post('/', validateUserCreation, (req: Request, res: Response, next: NextFunction) => {
  userController.createUser(req as Request<{}, {}, CreateUserDTO>, res, next);
});

// Profile routes (authenticated user's own profile)
router.get('/profile/me', protect(), (req: Request, res: Response, next: NextFunction) => {
  userController.getOwnProfile(req as AuthenticatedRequest, res, next);
});

router.put('/profile/me', protect(), validateUserUpdate, (req: Request, res: Response, next: NextFunction) => {
  userController.updateOwnProfile(req as AuthenticatedRequest & { body: UpdateUserDTO }, res, next);
});

// Protected routes with ID parameter
router.get('/:id', protect(), validateUUID('id'), (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  userController.getUser(req as Request<{ id: string }>, res, next);
});

router.put('/:id', protect(), validateUUID('id'), validateUserUpdate, (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  userController.updateUser(req as Request<{ id: string }, {}, UpdateUserDTO>, res, next);
});

router.delete('/:id', protect(), validateUUID('id'), (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  userController.deleteUser(req as Request<{ id: string }>, res, next);
});

export default router;
