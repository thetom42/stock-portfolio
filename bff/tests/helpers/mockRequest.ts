import { Request } from 'express';

// Extend Express Request type
export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
  };
  kauth?: {
    grant?: {
      access_token?: {
        content?: any;
      };
    };
  };
}

interface MockRequestOptions {
  params?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  headers?: Record<string, string>;
  user?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
  };
  kauth?: {
    grant?: {
      access_token?: {
        content?: any;
      };
    };
  };
}

export const createMockRequest = (options: MockRequestOptions = {}): Partial<RequestWithUser> => {
  return {
    params: options.params || {},
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {},
    user: options.user,
    kauth: options.kauth
  };
};
