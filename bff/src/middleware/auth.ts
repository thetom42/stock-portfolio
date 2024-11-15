import type { TypedRequest, TypedResponse, NextFunction, AuthenticatedRequest } from '../types/express';
import { protect } from '../config/keycloak';

// Define response types
type ErrorResponse = { message: string };

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
  res: TypedResponse<ErrorResponse>,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

export const verifyOwnership = (
  req: TypedRequest<{ userId?: string }, any, { userId?: string }>,
  res: TypedResponse<ErrorResponse>,
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
    (
      req: TypedRequest,
      res: TypedResponse<ErrorResponse>,
      next: NextFunction
    ) => {
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
  (
    req: TypedRequest,
    res: TypedResponse<ErrorResponse>,
    next: NextFunction
  ) => {
    const user = (req as AuthenticatedRequest).user;
    if (user.roles?.includes('admin')) {
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  }
];

export const attachUser = (
  req: TypedRequest,
  res: TypedResponse,
  next: NextFunction
) => {
  // This middleware would typically extract user info from the token
  // and attach it to the request. In our case, Keycloak is handling this.
  next();
};

interface AuthError extends Error {
  name: 'TokenExpiredError' | 'JsonWebTokenError' | string;
}

export const authErrorHandler = (
  err: AuthError,
  req: TypedRequest,
  res: TypedResponse<ErrorResponse>,
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
