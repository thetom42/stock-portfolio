import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response, NextFunction } from 'express';
import * as keycloakConfig from '../../../src/config/keycloak';
import auth from '../../../src/middleware/auth';

// Extend Request type to include user property
interface RequestWithUser extends Request {
  user?: {
    id: string;
    roles?: string[];
  };
}

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

describe('Auth Middleware', () => {
  let req: Partial<RequestWithUser>;
  let res: Partial<Response>;
  let next: sinon.SinonSpy;
  let jsonSpy: sinon.SinonSpy;
  let statusStub: sinon.SinonStub;

  beforeEach(() => {
    jsonSpy = sinon.spy();
    statusStub = sinon.stub().returns({ json: jsonSpy });
    req = {
      params: {},
      body: {},
      headers: {},
      user: undefined
    };
    res = {
      status: statusStub,
      json: jsonSpy
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

      auth.verifyOwnership(req as Request, res as Response, next as NextFunction);

      sinon.assert.called(next);
      sinon.assert.notCalled(statusStub);
    });

    it('should allow access for admin users regardless of user ID', () => {
      req.user = { 
        id: 'admin123',
        roles: ['admin']
      };
      req.params = { userId: 'user123' };

      auth.verifyOwnership(req as Request, res as Response, next as NextFunction);

      sinon.assert.called(next);
      sinon.assert.notCalled(statusStub);
    });

    it('should return 401 when no user is authenticated', () => {
      req.params = { userId: 'user123' };

      auth.verifyOwnership(req as Request, res as Response, next as NextFunction);

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

      auth.verifyOwnership(req as Request, res as Response, next as NextFunction);

      sinon.assert.calledWith(statusStub, 403);
      sinon.assert.calledWith(jsonSpy, { message: 'Forbidden' });
      sinon.assert.notCalled(next);
    });

    it('should check body userId if params userId is not present', () => {
      req.user = { id: 'user123' };
      req.body = { userId: 'user123' };
      req.params = {};

      auth.verifyOwnership(req as Request, res as Response, next as NextFunction);

      sinon.assert.called(next);
      sinon.assert.notCalled(statusStub);
    });
  });

  describe('requireRole', () => {
    let protectStub: sinon.SinonStub;

    beforeEach(() => {
      protectStub = sinon.stub(keycloakConfig, 'protect');
      protectStub.returns(() => (_req: Request, _res: Response, next: NextFunction) => next());
    });

    it('should allow access with correct role', () => {
      req.user = { id: 'user123', roles: ['required-role'] };

      const middleware = auth.requireRole('required-role');
      middleware(req as Request, res as Response, next as NextFunction);

      sinon.assert.called(protectStub);
      sinon.assert.called(next);
    });

    it('should deny access without correct role', () => {
      req.user = { id: 'user123', roles: ['other-role'] };
      protectStub.returns(() => (_req: Request, res: Response, _next: NextFunction) => {
        res.status(403).json({ message: 'Forbidden' });
      });

      const middleware = auth.requireRole('required-role');
      middleware(req as Request, res as Response, next as NextFunction);

      sinon.assert.called(protectStub);
      sinon.assert.calledWith(statusStub, 403);
      sinon.assert.calledWith(jsonSpy, { message: 'Forbidden' });
    });
  });

  describe('requireAdmin', () => {
    let protectStub: sinon.SinonStub;

    beforeEach(() => {
      protectStub = sinon.stub(keycloakConfig, 'protect');
      protectStub.returns(() => (_req: Request, _res: Response, next: NextFunction) => next());
    });

    it('should allow access for admin users', () => {
      req.user = { id: 'admin123', roles: ['admin'] };

      auth.requireAdmin(req as Request, res as Response, next as NextFunction);

      sinon.assert.called(protectStub);
      sinon.assert.called(next);
    });

    it('should deny access for non-admin users', () => {
      req.user = { id: 'user123', roles: ['user'] };
      protectStub.returns(() => (_req: Request, res: Response, _next: NextFunction) => {
        res.status(403).json({ message: 'Forbidden' });
      });

      auth.requireAdmin(req as Request, res as Response, next as NextFunction);

      sinon.assert.called(protectStub);
      sinon.assert.calledWith(statusStub, 403);
      sinon.assert.calledWith(jsonSpy, { message: 'Forbidden' });
    });
  });

  describe('attachUser', () => {
    let addUserInfoStub: sinon.SinonStub;

    beforeEach(() => {
      addUserInfoStub = sinon.stub(keycloakConfig, 'addUserInfo');
      addUserInfoStub.returns((req: Request, _res: Response, next: NextFunction) => {
        if ((req.headers.authorization as string) === 'Bearer valid-token') {
          (req as RequestWithUser).user = {
            id: 'user123',
            roles: ['user']
          };
          next();
        } else {
          next(new Error('Invalid token'));
        }
      });
    });

    it('should attach user info for valid token', () => {
      req.headers = { authorization: 'Bearer valid-token' };

      auth.attachUser(req as Request, res as Response, next as NextFunction);

      expect(req.user).to.deep.equal({
        id: 'user123',
        roles: ['user']
      });
      sinon.assert.called(addUserInfoStub);
      sinon.assert.called(next);
    });

    it('should pass error to next for invalid token', () => {
      req.headers = { authorization: 'Bearer invalid-token' };

      auth.attachUser(req as Request, res as Response, next as NextFunction);

      sinon.assert.called(addUserInfoStub);
      sinon.assert.calledWith(next, sinon.match.instanceOf(Error));
    });
  });

  describe('authErrorHandler', () => {
    let handleAuthErrorStub: sinon.SinonStub;

    beforeEach(() => {
      handleAuthErrorStub = sinon.stub(keycloakConfig, 'handleAuthError');
      handleAuthErrorStub.returns((err: Error, _req: Request, res: Response, next: NextFunction) => {
        if (err.name === 'TokenExpiredError') {
          res.status(401).json({ message: 'Token expired' });
          return;
        }
        if (err.name === 'JsonWebTokenError') {
          res.status(401).json({ message: 'Invalid token' });
          return;
        }
        next(err);
      });
    });

    it('should handle token expired error', () => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';

      auth.authErrorHandler(error, req as Request, res as Response, next as NextFunction);

      sinon.assert.called(handleAuthErrorStub);
      sinon.assert.calledWith(statusStub, 401);
      sinon.assert.calledWith(jsonSpy, { message: 'Token expired' });
    });

    it('should handle invalid token error', () => {
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';

      auth.authErrorHandler(error, req as Request, res as Response, next as NextFunction);

      sinon.assert.called(handleAuthErrorStub);
      sinon.assert.calledWith(statusStub, 401);
      sinon.assert.calledWith(jsonSpy, { message: 'Invalid token' });
    });

    it('should pass through other errors', () => {
      const error = new Error('Other error');

      auth.authErrorHandler(error, req as Request, res as Response, next as NextFunction);

      sinon.assert.called(handleAuthErrorStub);
      sinon.assert.calledWith(next, error);
    });
  });

  describe('initAuth', () => {
    it('should initialize all auth middleware', () => {
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
