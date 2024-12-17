import KeycloakConnect from 'keycloak-connect';
import session from 'express-session';
import { environment } from './environment';
import type { Request, Response, NextFunction, AuthUser, KeycloakToken } from '../types/express';
import { mapAuthProviderUser } from '../services/authMappingService';

// Session configuration
const memoryStore = new session.MemoryStore();
export const sessionConfig = {
  secret: environment.JWT_SECRET,
  resave: false,
  saveUninitialized: true,
  store: memoryStore,
  cookie: {
    secure: environment.NODE_ENV === 'production',
    maxAge: 1800000, // 30 minutes
  }
};

// Keycloak configuration
const keycloakConfig = {
  realm: environment.KEYCLOAK_REALM,
  'auth-server-url': environment.KEYCLOAK_AUTH_SERVER_URL,
  'ssl-required': 'none',
  resource: environment.KEYCLOAK_CLIENT_ID,
  credentials: {
    secret: environment.KEYCLOAK_CLIENT_SECRET
  },
  'confidential-port': 0,
  'bearer-only': true,
  'verify-token-audience': false,
  'use-resource-role-mappings': true,
  'enable-cors': true,
  'token-validation': {
    'verify-token-issuer': false
  }
};

console.log('Detailed Keycloak Config:', {
  ...keycloakConfig,
  credentials: { secret: '***' },
  'full-auth-server-url': `${keycloakConfig['auth-server-url']}/realms/${keycloakConfig.realm}`
});

// Initialize Keycloak instance
const keycloak = new KeycloakConnect({ store: memoryStore }, keycloakConfig);

// Mock protect middleware for test environment
const mockProtect = (role?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.status(401).json({
      error: {
        message: 'Unauthorized',
        details: 'Authentication required'
      }
    });
  };
};

// Middleware to protect routes
export const protect = (role?: string) => {
  if (environment.NODE_ENV === 'test') {
    return mockProtect(role);
  }
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Use Keycloak's built-in protect middleware
    keycloak.protect(role)(req, res, (err?: any) => {
      if (err) {
        console.error('Keycloak protect error:', err);
        return res.status(403).json({
          error: {
            message: 'Forbidden',
            details: 'Invalid or expired token'
          }
        });
      }
      next();
    });
  };
};

// Helper function to extract user info from token
export const extractUserInfo = async (token: KeycloakToken): Promise<AuthUser | undefined> => {
  if (!token || !token.sub || !token.email || !token.given_name || !token.family_name) {
    console.log('Missing required user info in token');
    return undefined;
  }

  // First create the auth provider user object
  const providerUser = {
    id: token.sub,
    email: token.email,
    firstName: token.given_name,
    lastName: token.family_name,
    roles: token.realm_access?.roles || []
  };

  // Map the provider user to our internal user
  const mappedUser = await mapAuthProviderUser(providerUser);
  if (!mappedUser) {
    console.log('Failed to map auth provider user to internal user');
    return undefined;
  }

  console.log('Mapped user info:', mappedUser);
  return mappedUser;
};

// Middleware to add user info to request
export const addUserInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Adding user info to request');
    if (req.kauth?.grant?.access_token?.content) {
      const userInfo = await extractUserInfo(req.kauth.grant.access_token.content);
      if (userInfo) {
        req.user = userInfo;
        console.log('User info added to request');
      } else {
        console.log('Failed to extract user info from token');
      }
    } else {
      console.log('No Keycloak grant found in request');
    }
    next();
  } catch (error) {
    console.error('Error in addUserInfo middleware:', error);
    next(error);
  }
};

// Custom error handler for authentication errors
export const handleAuthError = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Auth Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    code: err.code,
    details: err
  });

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: {
        message: 'Unauthorized',
        details: err.message || 'Invalid or expired token'
      }
    });
  }

  if (err.name === 'ForbiddenError' || err.statusCode === 403) {
    return res.status(403).json({
      error: {
        message: 'Forbidden',
        details: err.message || 'Access denied'
      }
    });
  }

  next(err);
};

export default keycloak;
