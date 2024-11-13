import type { Request, Response, NextFunction } from 'express-serve-static-core';
import { protect } from '../config/keycloak';
import { AuthenticatedRequest } from '../types/express';

// Type assertion helper for routes
export const asAuthenticatedHandler = <T extends (...args: any[]) => any>(
  handler: (req: AuthenticatedRequest, ...args: Parameters<T>) => ReturnType<T>
) => {
  return (req: Request, ...args: Parameters<T>) => {
    return handler(req as AuthenticatedRequest, ...args);
  };
};

export const assertAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export const verifyOwnership = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const targetUserId = req.params.userId || req.body.userId;
  if (user.roles?.includes('admin') || user.id === targetUserId) {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden' });
};

export const requireRole = (role: string) => {
  return [
    protect(),
    (req: Request, res: Response, next: NextFunction) => {
      const user = (req as AuthenticatedRequest).user;
      if (user.roles?.includes(role)) {
        next();
      } else {
        res.status(403).json({ message: 'Forbidden' });
      }
    }
  ];
};

export const requireAdmin = [
  protect(),
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.roles?.includes('admin')) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  }
];

export const attachUser = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // This middleware would typically extract user info from the token
  // and attach it to the request. In our case, Keycloak is handling this.
  next();
};

export const authErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }
  next(err);
};

export const initAuth = (app: any) => {
  const keycloak = require('../config/keycloak').default;
  app.use(keycloak.middleware());
  app.use(attachUser);
  app.use(authErrorHandler);
};
