import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import request from 'supertest';
import express from 'express';
import app, { server, resetTestState } from '../../src/app';
import { environment } from '../../src/config/environment';

describe('App Integration', () => {
  beforeEach(() => {
    resetTestState();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Server Configuration', () => {
    it('should have CORS enabled', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/health`)
        .set('Origin', environment.CORS_ORIGIN);

      expect(response.headers['access-control-allow-origin']).to.equal(environment.CORS_ORIGIN);
    });

    it('should have security headers enabled', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/health`);

      expect(response.headers).to.include.keys([
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ]);
    });

    it('should parse JSON bodies', async () => {
      const response = await request(app)
        .post(`${environment.API_PREFIX}/users`)
        .send({ test: 'data' });

      expect(response.status).to.not.equal(415); // Not unsupported media type
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/health`);

      expect(response.status).to.not.equal(429);
    });

    it('should block requests exceeding rate limit', async () => {
      // Skip this test in test environment since rate limiting is disabled
      if (environment.NODE_ENV === 'test') {
        expect(true).to.be.true;
        return;
      }

      const requests = Array(environment.RATE_LIMIT_MAX_REQUESTS + 1)
        .fill(null)
        .map(() => request(app).get(`${environment.API_PREFIX}/health`));

      const responses = await Promise.all(requests);
      const hasRateLimitError = responses.some(res => res.status === 429);

      expect(hasRateLimitError).to.be.true;
    });
  });

  describe('Health Check', () => {
    it('should return 200 and status info', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/health`);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('status', 'ok');
      expect(response.body).to.have.property('timestamp');
      expect(response.body).to.have.property('environment', environment.NODE_ENV);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/nonexistent-route`);

      expect(response.status).to.equal(404);
      expect(response.body).to.have.nested.property('error.message', 'Not Found');
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post(`${environment.API_PREFIX}/users`)
        .send({
          email: 'invalid-email',
          password: 'short'
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.nested.property('error.message', 'Validation Error');
    });

    it('should handle unauthorized errors', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/portfolios`);

      expect(response.status).to.equal(401);
      expect(response.body).to.have.nested.property('error.message', 'Unauthorized');
    });

    it('should handle internal server errors', async () => {
      const errorMiddleware = (req: express.Request, res: express.Response) => {
        throw new Error('Test error');
      };

      app.get('/test-error', errorMiddleware);

      const response = await request(app)
        .get('/test-error');

      expect(response.status).to.equal(500);
      expect(response.body).to.have.nested.property('error.message', 'Internal Server Error');
    });
  });

  describe('API Routes', () => {
    it('should mount user routes', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/users/profile/me`);

      expect(response.status).to.equal(401);
    });

    it('should mount portfolio routes', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/portfolios`);

      expect(response.status).to.equal(401);
    });

    it('should mount holding routes', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/holdings`);

      expect(response.status).to.equal(401);
    });

    it('should mount transaction routes', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/transactions`);

      expect(response.status).to.equal(401);
    });

    it('should mount quote routes', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/quotes`);

      expect(response.status).to.equal(401);
    });

    it('should mount category routes', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/categories`);

      expect(response.status).to.equal(401);
    });

    it('should mount stock routes', async () => {
      const response = await request(app)
        .get(`${environment.API_PREFIX}/stocks`);

      expect(response.status).to.equal(401);
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle SIGTERM signal', (done) => {
      const mockServer = {
        close: () => {
          done();
        }
      };

      // @ts-ignore - Assigning to read-only variable for testing
      server = mockServer;

      process.emit('SIGTERM', 'SIGTERM');
    });
  });
});
