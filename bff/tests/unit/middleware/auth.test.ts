import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express-serve-static-core';
import * as keycloakConfig from '../../../src/config/keycloak';
import * as auth from '../../../src/middleware/auth';

// Extend Request type to include user property
interface RequestWithUser {
  user?: {
    id: string;
    roles?: string[];
  };
  params: {
    [key: string]: string;
  };
  body: any;
  headers: {
    [key: string]: string;
  };
}

describe('Auth Middleware', () => {
  let req: RequestWithUser;
  let res: Partial<Response>;
  let next: sinon.SinonSpy;
  let jsonSpy: sinon.SinonSpy;
  let statusStub: sinon.SinonStub;
  let endStub: sinon.SinonStub;

  beforeEach(() => {
    jsonSpy = sinon.spy();
    endStub = sinon.stub();
    statusStub = sinon.stub().returns({ json: jsonSpy, end: endStub });
    req = {
      params: {},
      body: {},
      headers: {},
      user: undefined
    } as RequestWithUser;
    res = {
      status: statusStub,
      json: jsonSpy,
      end: endStub
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('verifyOwnership', () => {
    it('should allow access when user IDs match', () => {
      req.user = { id: 'user123' };
      req.params = { userId: 'user123' };

      auth.verifyOwnership(req as any, res as Response, next);

      sinon.assert.called(next);
      sinon.assert.notCalled(statusStub);
    });

    it('should allow access for admin users regardless of user ID', () => {
      req.user = { 
        id: 'admin123',
        roles: ['admin']
      };
      req.params = { userId: 'user123' };

      auth.verifyOwnership(req as any, res as Response, next);

      sinon.assert.called(next);
      sinon.assert.notCalled(statusStub);
    });

    it('should return 401 when no user is authenticated', () => {
      req.params = { userId: 'user123' };

      auth.verifyOwnership(req as any, res as Response, next);

      sinon.assert.calledWith(statusStub, 401);
      sinon.assert.calledWith(jsonSpy, { message: 'Unauthorized' });
      sinon.assert.notCalled(next);
    });

    it('should return 403 when user IDs do not match and user is not admin', () => {
      req.user = { 
        id: 'user456',
        roles: ['user']
      };
      req.params = { userId: 'user123' };

      auth.verifyOwnership(req as any, res as Response, next);

      sinon.assert.calledWith(statusStub, 403);
      sinon.assert.calledWith(jsonSpy, { message: 'Forbidden' });
      sinon.assert.notCalled(next);
    });

    it('should check body userId if params userId is not present', () => {
      req.user = { id: 'user123' };
      req.body = { userId: 'user123' };
      req.params = {};

      auth.verifyOwnership(req as any, res as Response, next);

      sinon.assert.called(next);
      sinon.assert.notCalled(statusStub);
    });
  });

  describe('requireRole', () => {
    let protectStub: sinon.SinonStub;

    beforeEach(() => {
      protectStub = sinon.stub(keycloakConfig, 'protect');
      protectStub.returns((_req: Request, _res: Response, n: NextFunction) => n());
    });

    it('should allow access with correct role', () => {
      req.user = { id: 'user123', roles: ['required-role'] };

      const middlewares = auth.requireRole('required-role');
      // Execute protect middleware
      middlewares[0](req as any, res as Response, next);
      // Execute role check middleware
      middlewares[1](req as any, res as Response, next);

      sinon.assert.called(protectStub);
      sinon.assert.calledTwice(next);
    });

    it('should deny access without correct role', () => {
      req.user = { id: 'user123', roles: ['other-role'] };

      const middlewares = auth.requireRole('required-role');
      // Execute protect middleware
      middlewares[0](req as any, res as Response, next);
      // Execute role check middleware
      middlewares[1](req as any, res as Response, next);

      sinon.assert.called(protectStub);
      sinon.assert.calledWith(statusStub, 403);
      sinon.assert.calledWith(jsonSpy, { message: 'Forbidden' });
    });
  });

  describe('requireAdmin', () => {
    let protectStub: sinon.SinonStub;

    beforeEach(() => {
      protectStub = sinon.stub(keycloakConfig, 'protect');
      protectStub.returns((_req: Request, _res: Response, n: NextFunction) => n());
    });

    it('should allow access for admin users', () => {
      req.user = { id: 'admin123', roles: ['admin'] };

      // Get the protect middleware function
      const protectMiddleware = protectStub();
      // Execute protect middleware
      protectMiddleware(req as any, res as Response, next);
      // Execute admin check middleware
      auth.requireAdmin[1](req as any, res as Response, next);

      sinon.assert.called(protectStub);
      sinon.assert.calledTwice(next);
    });

    it('should deny access for non-admin users', () => {
      req.user = { id: 'user123', roles: ['user'] };

      // Get the protect middleware function
      const protectMiddleware = protectStub();
      // Execute protect middleware
      protectMiddleware(req as any, res as Response, next);
      // Execute admin check middleware
      auth.requireAdmin[1](req as any, res as Response, next);

      sinon.assert.called(protectStub);
      sinon.assert.calledWith(statusStub, 403);
      sinon.assert.calledWith(jsonSpy, { message: 'Forbidden' });
    });
  });

  describe('assertAuthenticated', () => {
    it('should allow access when user is authenticated', () => {
      req.user = { id: 'user123' };

      auth.assertAuthenticated(req as any, res as Response, next);

      sinon.assert.called(next);
      sinon.assert.notCalled(statusStub);
    });

    it('should deny access when user is not authenticated', () => {
      auth.assertAuthenticated(req as any, res as Response, next);

      sinon.assert.calledWith(statusStub, 401);
      sinon.assert.calledWith(jsonSpy, { message: 'Unauthorized' });
      sinon.assert.notCalled(next);
    });
  });

  describe('authErrorHandler', () => {
    it('should handle token expired error', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      auth.authErrorHandler(error, req as any, res as Response, next);

      sinon.assert.calledWith(statusStub, 401);
      sinon.assert.calledWith(jsonSpy, { message: 'Token expired' });
    });

    it('should handle invalid token error', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      auth.authErrorHandler(error, req as any, res as Response, next);

      sinon.assert.calledWith(statusStub, 401);
      sinon.assert.calledWith(jsonSpy, { message: 'Invalid token' });
    });

    it('should pass through other errors', () => {
      const error = new Error('Other error');

      auth.authErrorHandler(error, req as any, res as Response, next);

      sinon.assert.calledWith(next, error);
    });
  });

  describe('initAuth', () => {
    it('should initialize all middleware', () => {
      const app = {
        use: sinon.spy()
      };

      const mockKeycloak = {
        middleware: () => 'keycloak-middleware'
      };
      sinon.stub(keycloakConfig, 'default').value(mockKeycloak);

      auth.initAuth(app);

      sinon.assert.calledThrice(app.use);
      sinon.assert.calledWith(app.use, 'keycloak-middleware');
      sinon.assert.calledWith(app.use, auth.attachUser);
      sinon.assert.calledWith(app.use, auth.authErrorHandler);
    });
  });
});
