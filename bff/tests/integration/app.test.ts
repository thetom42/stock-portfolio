import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import express from 'express';
import app from '../../src/app';
import { environment } from '../../src/config/environment';

describe('App Integration', () => {
  let server: express.Application;

  before(() => {
    server = app;
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Server Configuration', () => {
    it('should have CORS enabled', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/health`)
        .set('Origin', environment.CORS_ORIGIN);

      expect(response.headers['access-control-allow-origin']).to.equal(environment.CORS_ORIGIN);
    });

    it('should have security headers enabled', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/health`);

      expect(response.headers).to.include.keys([
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ]);
    });

    it('should parse JSON bodies', async () => {
      const response = await request(server)
        .post(`${environment.API_PREFIX}/users`)
        .send({ test: 'data' });

      expect(response.status).to.not.equal(415); // Not unsupported media type
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/health`);

      expect(response.status).to.not.equal(429);
    });

    it('should block requests exceeding rate limit', async () => {
      const requests = Array(environment.RATE_LIMIT_MAX_REQUESTS + 1)
        .fill(null)
        .map(() => request(server).get(`${environment.API_PREFIX}/health`));

      const responses = await Promise.all(requests);
      const hasRateLimitError = responses.some(res => res.status === 429);

      expect(hasRateLimitError).to.be.true;
    });
  });

  describe('Health Check', () => {
    it('should return 200 and status info', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/health`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('status', 'ok');
      expect(response.body).to.have.property('timestamp');
      expect(response.body).to.have.property('environment', environment.NODE_ENV);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/nonexistent-route`);

      expect(response.status).to.equal(404);
      expect(response.body).to.have.nested.property('error.message', 'Not Found');
    });

    it('should handle validation errors', async () => {
      // Example: Create user with invalid data
      const response = await request(server)
        .post(`${environment.API_PREFIX}/users`)
        .send({
          email: 'invalid-email',
          password: 'short'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.nested.property('error.message', 'Validation Error');
    });

    it('should handle unauthorized errors', async () => {
      // Try to access protected route without authentication
      const response = await request(server)
        .get(`${environment.API_PREFIX}/portfolios`);

      expect(response.status).to.equal(401);
      expect(response.body).to.have.nested.property('error.message', 'Unauthorized');
    });

    it('should handle internal server errors', async () => {
      // Mock a route that throws an error
      const router = express.Router();
      router.get('/error-test', () => {
        throw new Error('Test error');
      });
      server.use(router);

      const response = await request(server)
        .get('/error-test');

      expect(response.status).to.equal(500);
      expect(response.body).to.have.nested.property('error.message', 'Internal Server Error');

      // In development, should include stack trace
      if (environment.NODE_ENV === 'development') {
        expect(response.body.error).to.have.property('stack');
      } else {
        expect(response.body.error).to.not.have.property('stack');
      }
    });
  });

  describe('API Routes', () => {
    it('should mount user routes', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/users/profile`);

      expect(response.status).to.equal(401); // Should exist but be protected
    });

    it('should mount portfolio routes', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/portfolios`);

      expect(response.status).to.equal(401); // Should exist but be protected
    });

    it('should mount holding routes', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/holdings`);

      expect(response.status).to.equal(401); // Should exist but be protected
    });

    it('should mount transaction routes', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/transactions`);

      expect(response.status).to.equal(401); // Should exist but be protected
    });

    it('should mount quote routes', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/quotes`);

      expect(response.status).to.equal(401); // Should exist but be protected
    });

    it('should mount category routes', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/categories`);

      expect(response.status).to.equal(401); // Should exist but be protected
    });

    it('should mount stock routes', async () => {
      const response = await request(server)
        .get(`${environment.API_PREFIX}/stocks`);

      expect(response.status).to.equal(401); // Should exist but be protected
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle SIGTERM signal', (done) => {
      const closeStub = sinon.stub().callsFake(() => {
        done();
      });

      const serverMock = {
        close: closeStub
      };

      // Simulate SIGTERM
      process.emit('SIGTERM', 'SIGTERM');

      expect(closeStub.called).to.be.true;
    });
  });
});
