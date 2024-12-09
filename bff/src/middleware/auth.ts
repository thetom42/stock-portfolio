import type { TypedRequest, TypedResponse, NextFunction, AuthenticatedRequest } from '../types/express';
import { protect, handleAuthError } from '../config/keycloak';

// Type assertion helper for routes with proper generic support
export const asAuthenticatedHandler = <
  T extends (...args: any[]) => any,
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
>(
  handler: (
    req: AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>,
    ...args: Parameters<T>
  ) => ReturnType<T>
) => {
  return (
    req: TypedRequest<P, ResBody, ReqBody, ReqQuery>,
    ...args: Parameters<T>
  ) => {
    return handler(req as AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>, ...args);
  };
};

export const assertAuthenticated = (
  req: TypedRequest,
  res: TypedResponse,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export const verifyOwnership = (
  req: TypedRequest<{ userId?: string }, any, { userId?: string }>,
  res: TypedResponse,
  next: NextFunction
) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const targetUserId = req.params.userId || req.body.userId;
  if (user.roles?.includes('admin') || user.id === targetUserId) {
    return next();
  }

  return res.status(403).json({ message: 'Forbidden' });
};

// Middleware factory for role-based authorization
export const requireRole = (role: string) => {
  return [
    protect(role),
    (
      req: TypedRequest,
      res: TypedResponse,
      next: NextFunction
    ) => {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      if (user.roles?.includes(role)) {
        next();
      } else {
        res.status(403).json({ message: 'Forbidden' });
      }
    }
  ];
};

// Admin role check middleware
export const requireAdmin = [
  protect('admin'),
  (
    req: TypedRequest,
    res: TypedResponse,
    next: NextFunction
  ) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (user.roles?.includes('admin')) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  }
];

// Keycloak handles user attachment through its middleware
export const attachUser = (
  req: TypedRequest,
  res: TypedResponse,
  next: NextFunction
) => {
  next();
};

interface AuthError extends Error {
  name: 'TokenExpiredError' | 'JsonWebTokenError' | 'UnauthorizedError' | 'ForbiddenError' | string;
  statusCode?: number;
  code?: string | number;
}

export const authErrorHandler = (
  err: AuthError,
  req: TypedRequest,
  res: TypedResponse,
  next: NextFunction
) => {
  console.error('Auth Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    code: err.code,
    details: err
  });

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: err.message || 'Invalid or expired token' });
  }

  if (err.name === 'ForbiddenError' || err.statusCode === 403) {
    return res.status(403).json({ message: err.message || 'Access denied' });
  }

  next(err);
};

export const initAuth = (app: any) => {
  const keycloak = require('../config/keycloak').default;
  app.use(keycloak.middleware());
  app.use(attachUser);
  app.use(authErrorHandler);
};
