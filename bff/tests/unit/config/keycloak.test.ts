import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import KeycloakConnect from 'keycloak-connect';
import session from 'express-session';
import { Request, Response } from 'express';
import { environment } from '../../../src/config/environment';
import keycloak, {
  sessionConfig,
  protect,
  extractUserInfo,
  addUserInfo,
  handleAuthError
} from '../../../src/config/keycloak';

// Define custom request type for tests
interface RequestWithUser extends Request {
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

describe('Keycloak Configuration', () => {
  let mockKeycloak: any;
  let keycloakStub: sinon.SinonStub;

  beforeEach(() => {
    mockKeycloak = {
      protect: sinon.stub().returns((req: any, res: any, next: any) => next())
    };
    keycloakStub = sinon.stub(KeycloakConnect.prototype, 'constructor').returns(mockKeycloak);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Session Configuration', () => {
    it('should configure session with correct settings', () => {
      expect(sessionConfig).to.deep.include({
        secret: environment.JWT_SECRET,
        resave: false,
        saveUninitialized: true
      });
    });

    it('should use MemoryStore', () => {
      expect(sessionConfig.store).to.be.instanceOf(session.MemoryStore);
    });

    it('should configure secure cookies in production', () => {
      const originalEnv = environment.NODE_ENV;
      // @ts-ignore - Modifying readonly property
      environment.NODE_ENV = 'production';

      expect(sessionConfig.cookie.secure).to.be.true;

      // @ts-ignore - Restoring readonly property
      environment.NODE_ENV = originalEnv;
    });

    it('should not require secure cookies in development', () => {
      const originalEnv = environment.NODE_ENV;
      // @ts-ignore - Modifying readonly property
      environment.NODE_ENV = 'development';

      expect(sessionConfig.cookie.secure).to.be.false;

      // @ts-ignore - Restoring readonly property
      environment.NODE_ENV = originalEnv;
    });

    it('should set appropriate cookie max age', () => {
      expect(sessionConfig.cookie.maxAge).to.equal(1800000); // 30 minutes
    });
  });

  describe('Keycloak Instance', () => {
    it('should initialize with correct configuration', () => {
      expect(keycloak).to.exist;
      const config = keycloakStub.firstCall.args[1];
      expect(config).to.deep.include({
        realm: environment.KEYCLOAK_REALM,
        'auth-server-url': environment.KEYCLOAK_AUTH_SERVER_URL,
        resource: environment.KEYCLOAK_CLIENT_ID,
        credentials: {
          secret: environment.KEYCLOAK_CLIENT_SECRET
        },
        'confidential-port': 0,
        'bearer-only': true
      });
    });

    it('should require external SSL in production', () => {
      const originalEnv = environment.NODE_ENV;
      // @ts-ignore - Modifying readonly property
      environment.NODE_ENV = 'production';

      const config = keycloakStub.firstCall.args[1];
      expect(config['ssl-required']).to.equal('external');

      // @ts-ignore - Restoring readonly property
      environment.NODE_ENV = originalEnv;
    });

    it('should not require SSL in development', () => {
      const originalEnv = environment.NODE_ENV;
      // @ts-ignore - Modifying readonly property
      environment.NODE_ENV = 'development';

      const config = keycloakStub.firstCall.args[1];
      expect(config['ssl-required']).to.equal('none');

      // @ts-ignore - Restoring readonly property
      environment.NODE_ENV = originalEnv;
    });
  });

  describe('Protection Middleware', () => {
    it('should create basic protection middleware', () => {
      const middleware = protect();
      expect(middleware).to.be.a('function');
      expect(mockKeycloak.protect.called).to.be.true;
    });

    it('should create role-based protection middleware', () => {
      const role = 'admin';
      const middleware = protect(role);
      expect(middleware).to.be.a('function');
      expect(mockKeycloak.protect.called).to.be.true;

      // Test the role check function
      const checkFunction = mockKeycloak.protect.firstCall.args[0];
      expect(checkFunction({ hasRole: (r: string) => r === role })).to.be.true;
      expect(checkFunction({ hasRole: (r: string) => r !== role })).to.be.false;
    });
  });

  describe('User Info Extraction', () => {
    it('should extract user info from valid token', () => {
      const token = {
        sub: 'user123',
        email: 'test@example.com',
        given_name: 'John',
        family_name: 'Doe',
        realm_access: {
          roles: ['user', 'admin']
        }
      };

      const userInfo = extractUserInfo(token);

      if (!userInfo) {
        throw new Error('User info should not be null');
      }

      expect(userInfo).to.deep.equal({
        id: 'user123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roles: ['user', 'admin']
      });
    });

    it('should handle missing token', () => {
      const userInfo = extractUserInfo(null);
      expect(userInfo).to.be.null;
    });

    it('should handle missing optional fields', () => {
      const token = {
        sub: 'user123',
        email: 'test@example.com'
      };

      const userInfo = extractUserInfo(token);

      if (!userInfo) {
        throw new Error('User info should not be null');
      }

      expect(userInfo).to.deep.include({
        id: 'user123',
        email: 'test@example.com'
      });
      expect(userInfo.roles).to.deep.equal([]);
    });
  });

  describe('Add User Info Middleware', () => {
    it('should add user info to request when token exists', () => {
      const req = {
        kauth: {
          grant: {
            access_token: {
              content: {
                sub: 'user123',
                email: 'test@example.com'
              }
            }
          }
        }
      } as RequestWithUser;
      const res = {} as Response;
      const next = sinon.spy();

      addUserInfo(req, res, next);

      expect(req.user).to.exist;
      expect(req.user?.id).to.equal('user123');
      expect(next.called).to.be.true;
    });

    it('should not add user info when token missing', () => {
      const req = {} as RequestWithUser;
      const res = {} as Response;
      const next = sinon.spy();

      addUserInfo(req, res, next);

      expect(req.user).to.be.undefined;
      expect(next.called).to.be.true;
    });
  });

  describe('Auth Error Handler', () => {
    it('should handle unauthorized errors', () => {
      const err = new Error('Unauthorized');
      err.name = 'UnauthorizedError';
      const req = {} as RequestWithUser;
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      } as any;
      const next = sinon.spy();

      handleAuthError(err, req, res, next);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      })).to.be.true;
      expect(next.called).to.be.false;
    });

    it('should pass through other errors', () => {
      const err = new Error('Other error');
      const req = {} as RequestWithUser;
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      } as any;
      const next = sinon.spy();

      handleAuthError(err, req, res, next);

      expect(res.status.called).to.be.false;
      expect(res.json.called).to.be.false;
      expect(next.calledWith(err)).to.be.true;
    });
  });
});
