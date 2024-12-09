import sinon from 'sinon';
import type { NextFunction, Request, Response, AuthUser, KeycloakToken, KeycloakGrant } from '../../src/types/express';
import type { RequestWithUser } from './mockRequest';
import type { MockResponse } from './mockResponse';

export interface MockToken extends Omit<KeycloakToken, 'hasRole' | 'isExpired' | 'hasApplicationRole' | 'hasRealmRole'> {
  hasRole: (role: string) => boolean;
  isExpired: () => boolean;
  hasApplicationRole: (app: string, role: string) => boolean;
  hasRealmRole: (role: string) => boolean;
}

export interface MockGrant extends Omit<KeycloakGrant, 'access_token'> {
  access_token: {
    token: string;
    content: MockToken;
  };
}

export const createMockToken = (options: Partial<Omit<MockToken, 'hasRole' | 'isExpired' | 'hasApplicationRole' | 'hasRealmRole'>> = {}): MockToken => {
  const roles = options.realm_access?.roles || ['user'];
  return {
    sub: options.sub || 'user123',
    email: options.email || 'test@example.com',
    given_name: options.given_name || 'John',
    family_name: options.family_name || 'Doe',
    realm_access: {
      roles
    },
    hasRole: (role: string) => roles.includes(role),
    isExpired: () => false,
    hasApplicationRole: () => false,
    hasRealmRole: (role: string) => roles.includes(role)
  };
};

export const createMockGrant = (token: MockToken): MockGrant => ({
  access_token: {
    token: 'mock-token',
    content: token
  }
});

export interface MockKeycloak {
  protect: sinon.SinonStub;
  middleware: sinon.SinonStub;
  authenticated: sinon.SinonStub;
  deauthenticated: sinon.SinonStub;
}

export const createMockKeycloak = (): MockKeycloak => {
  return {
    protect: sinon.stub().returns((_req: RequestWithUser, _res: MockResponse, next: NextFunction) => next()),
    middleware: sinon.stub().returns((_req: RequestWithUser, _res: MockResponse, next: NextFunction) => next()),
    authenticated: sinon.stub(),
    deauthenticated: sinon.stub()
  };
};

// Helper function to simulate authenticated request
export const simulateAuthenticated = (
  req: RequestWithUser,
  token: MockToken = createMockToken()
) => {
  req.kauth = {
    grant: createMockGrant(token)
  };
  req.user = {
    id: token.sub || 'user123',
    email: token.email,
    firstName: token.given_name,
    lastName: token.family_name,
    roles: token.realm_access?.roles
  };
};

// Helper function to create role-based protection middleware
export const createProtectionMiddleware = (requiredRole?: string) => {
  return (req: RequestWithUser, res: MockResponse, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        error: {
          message: 'Unauthorized',
          details: 'Authentication required'
        }
      });
      return;
    }

    if (requiredRole && (!req.user.roles || !req.user.roles.includes(requiredRole))) {
      res.status(403).json({
        error: {
          message: 'Forbidden',
          details: 'Insufficient permissions'
        }
      });
      return;
    }

    next();
  };
};

// Helper function to verify authentication was checked
export const verifyAuthenticationChecked = (keycloak: MockKeycloak) => {
  sinon.assert.called(keycloak.protect);
};

// Helper function to verify role was checked
export const verifyRoleChecked = (keycloak: MockKeycloak, role: string) => {
  sinon.assert.calledWith(keycloak.protect, sinon.match.func);
  const roleCheck = keycloak.protect.firstCall.args[0];
  const mockToken = createMockToken({ realm_access: { roles: [role] } });
  const result = roleCheck(mockToken);
  return result === true;
};
