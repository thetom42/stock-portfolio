import { Request, Response, NextFunction } from 'express';
import keycloak, { protect, addUserInfo, handleAuthError } from '../config/keycloak';

// Middleware to protect routes requiring authentication
export const requireAuth = protect();

// Middleware to protect routes requiring specific role
export const requireRole = (role: string) => protect(role);

// Middleware to attach user information to request
export const attachUser = addUserInfo;

// Middleware to verify admin access
export const requireAdmin = protect('admin');

// Middleware to verify resource ownership
export const verifyOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const resourceUserId = req.params.userId || req.body.userId;
  const currentUserId = req.user?.id;

  if (!currentUserId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (resourceUserId && resourceUserId !== currentUserId) {
    // Allow admin to access any resource
    if (req.user?.roles?.includes('admin')) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  }

  next();
};

// Error handling middleware for authentication errors
export const authErrorHandler = handleAuthError;

// Initialize Keycloak middleware
export const initAuth = (app: any) => {
  app.use(keycloak.middleware());
  app.use(attachUser);
  app.use(authErrorHandler);
};

export default {
  requireAuth,
  requireRole,
  requireAdmin,
  verifyOwnership,
  attachUser,
  authErrorHandler,
  initAuth
};
