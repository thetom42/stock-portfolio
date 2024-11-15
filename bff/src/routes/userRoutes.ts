import { protect } from '../config/keycloak';
import * as userController from '../controllers/userController';
import { validateUserCreation, validateUserUpdate, validateUUID } from '../middleware/validation';
import type { TypedRequest, TypedResponse, NextFunction, AuthenticatedRequest } from '../types/express';
import { CreateUserDTO, UpdateUserDTO, User } from '../models/User';

import * as express from 'express';
const router = express.Router();

// Define response types
type UserResponse = { user: User };
type ErrorResponse = { error: string };

// Public routes
router.post('/', 
  validateUserCreation,
  (
    req: TypedRequest<{}, {}, CreateUserDTO>,
    res: TypedResponse<UserResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    userController.createUser(req, res, next);
  }
);

// Profile routes (authenticated user's own profile)
router.get('/profile/me',
  protect(),
  (
    req: AuthenticatedRequest,
    res: TypedResponse<UserResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    userController.getOwnProfile(req, res, next);
  }
);

router.put('/profile/me',
  protect(),
  validateUserUpdate,
  (
    req: AuthenticatedRequest<{}, {}, UpdateUserDTO>,
    res: TypedResponse<UserResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    userController.updateOwnProfile(req, res, next);
  }
);

// Protected routes with ID parameter
router.get('/:id',
  protect(),
  validateUUID('id'),
  (
    req: TypedRequest<{ id: string }>,
    res: TypedResponse<UserResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    userController.getUser(req, res, next);
  }
);

router.put('/:id',
  protect(),
  validateUUID('id'),
  validateUserUpdate,
  (
    req: TypedRequest<{ id: string }, {}, UpdateUserDTO>,
    res: TypedResponse<UserResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    userController.updateUser(req, res, next);
  }
);

router.delete('/:id',
  protect(),
  validateUUID('id'),
  (
    req: TypedRequest<{ id: string }>,
    res: TypedResponse<void | ErrorResponse>,
    next: NextFunction
  ) => {
    userController.deleteUser(req, res, next);
  }
);

export default router;
