import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import { ParamsDictionary, Query, Send } from 'express-serve-static-core';
import { Token } from 'keycloak-connect';

// Core custom types
export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles?: string[];
}

// Keycloak types
export interface KeycloakToken extends Token {
  realm_access?: {
    roles: string[];
  };
  email?: string;
  given_name?: string;
  family_name?: string;
  sub?: string;
}

export interface KeycloakGrant {
  access_token: {
    token: string;
    content: KeycloakToken;
  };
}

// Extend Express namespace for global augmentation
declare global {
  namespace Express {
    interface Request {
      user: AuthUser;
      kauth?: AuthenticatedRequest['kauth'];
    }
  }
}

// Export base Express types with proper generic support
export interface Request<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query,
> extends ExpressRequest<P, ResBody, ReqBody, ReqQuery> {
  body: ReqBody;
  query: ReqQuery;
  params: P;
  user?: AuthUser;
  kauth?: {
    grant?: KeycloakGrant;
  };
  path: string;
  method: string;
  url: string;
  originalUrl: string;
  baseUrl: string;
  headers: {
    [key: string]: string | string[] | undefined;
    authorization?: string;
  };
}

export interface Response<ResBody = any> extends ExpressResponse<ResBody> {
  status(code: number): this;
  json(body: ResBody): this;
  send: Send<ResBody, this>;
  sendStatus(code: number): this;
}

// Type-safe request/response helpers
export type TypedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query,
> = Request<P, ResBody, ReqBody, ReqQuery>;

export type TypedResponse<T = any> = Response<T>;

// Common type aliases with generic support
export type AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = Query,
> = Request<P, ResBody, ReqBody, ReqQuery> & {
  user: AuthUser; // Make user required for authenticated requests
};

// Re-export NextFunction
export { NextFunction };

// Prevent express module export
declare module 'express' {
  export = e;
}
declare const e: Express.Express;
export default e;
