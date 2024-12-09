import type { Request, AuthUser, KeycloakToken, KeycloakGrant } from '../../src/types/express';

// Extend Request type with Keycloak auth
export interface RequestWithUser extends Request {
  user?: AuthUser;
  kauth?: {
    grant?: KeycloakGrant;
  };
}

interface MockRequestOptions {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  headers?: { [key: string]: string | undefined };
  user?: AuthUser;
  kauth?: {
    grant?: KeycloakGrant;
  };
}

export const createMockRequest = (options: MockRequestOptions = {}): Partial<RequestWithUser> => {
  const mockRequest: Partial<RequestWithUser> = {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {},
    user: options.user,
    kauth: options.kauth,
    path: '',
    method: 'GET',
    url: ''
  };

  return mockRequest;
};
