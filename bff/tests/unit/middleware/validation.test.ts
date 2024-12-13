import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import type { Request, Response, NextFunction } from 'express-serve-static-core';
import { validationResult } from 'express-validator';
import * as validation from '../../../src/middleware/validation';

describe('Validation Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: sinon.SinonSpy;
  let jsonSpy: sinon.SinonSpy;
  let statusStub: sinon.SinonStub;

  beforeEach(() => {
    jsonSpy = sinon.spy();
    statusStub = sinon.stub().returns({ json: jsonSpy });
    req = {
      body: {},
      params: {},
      query: {}
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

  describe('handleValidationErrors', () => {
    it('should call next if no validation errors', () => {
      // Mock validationResult to return empty errors
      sinon.stub(validationResult(req as Request), 'isEmpty').returns(true);
      
      validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);
      
      sinon.assert.called(next);
      sinon.assert.notCalled(statusStub);
    });

    it('should return 400 if validation errors exist', async () => {
      // Create a request with validation errors
      req.body = { email: 'invalid-email' };
      
      // Apply email validation and check result
      await validation.validateUserCreation[0](req as Request, res as Response, next as NextFunction);
      validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

      sinon.assert.calledWith(statusStub, 400);
      sinon.assert.calledWith(jsonSpy, sinon.match.has('errors'));
    });
  });

  describe('User Validation', () => {
    describe('validateUserCreation', () => {
      it('should validate valid user data', async () => {
        req.body = {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'Password123'
        };

        for (const validator of validation.validateUserCreation.slice(0, -1)) {
          await validator(req as Request, res as Response, next as NextFunction);
        }
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.called(next);
        sinon.assert.notCalled(statusStub);
      });

      it('should reject invalid email', async () => {
        req.body = {
          email: 'invalid-email',
          firstName: 'John',
          lastName: 'Doe',
          password: 'Password123'
        };

        await validation.validateUserCreation[0](req as Request, res as Response, next as NextFunction);
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.calledWith(statusStub, 400);
        const errors = jsonSpy.firstCall.args[0].errors;
        expect(errors[0].msg).to.equal('Invalid email address');
      });

      it('should reject weak password', async () => {
        req.body = {
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'weak'
        };

        await validation.validateUserCreation[3](req as Request, res as Response, next as NextFunction);
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.calledWith(statusStub, 400);
        const errors = jsonSpy.firstCall.args[0].errors;
        expect(errors[0].msg).to.include('Password must be');
      });
    });

    describe('validateUserUpdate', () => {
      it('should allow partial updates', async () => {
        req.body = {
          firstName: 'John'
        };

        for (const validator of validation.validateUserUpdate.slice(0, -1)) {
          await validator(req as Request, res as Response, next as NextFunction);
        }
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.called(next);
        sinon.assert.notCalled(statusStub);
      });

      it('should validate optional email if provided', async () => {
        req.body = {
          email: 'invalid-email'
        };

        await validation.validateUserUpdate[2](req as Request, res as Response, next as NextFunction);
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.calledWith(statusStub, 400);
        const errors = jsonSpy.firstCall.args[0].errors;
        expect(errors[0].msg).to.equal('Invalid email address');
      });
    });
  });

  describe('Stock Validation', () => {
    describe('validateStockCreation', () => {
      it('should validate valid stock data', async () => {
        req.body = {
          isin: 'US0378331005',
          name: 'Apple Inc.',
          wkn: 'ABC123',
          symbol: 'AAPL',
          categoryId: '123e4567-e89b-12d3-a456-426614174000'
        };

        // Execute all validation rules except handleValidationErrors
        for (const validator of validation.validateStockCreation.slice(0, -1)) {
          await validator(req as Request, res as Response, next as NextFunction);
        }
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.called(next);
        sinon.assert.notCalled(statusStub);
      });

      it('should reject invalid ISIN', async () => {
        req.body = {
          isin: 'invalid-isin',
          name: 'Apple Inc.',
          wkn: 'ABC123',
          symbol: 'AAPL',
          categoryId: '123e4567-e89b-12d3-a456-426614174000'
        };

        // Execute ISIN validation
        await validation.validateStockCreation[0](req as Request, res as Response, next as NextFunction);
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.calledWith(statusStub, 400);
        const errors = jsonSpy.firstCall.args[0].errors;
        expect(errors[0].msg).to.equal('Invalid ISIN format');
      });

      it('should reject invalid WKN', async () => {
        req.body = {
          isin: 'US0378331005',
          name: 'Apple Inc.',
          wkn: 'invalid',
          symbol: 'AAPL',
          categoryId: '123e4567-e89b-12d3-a456-426614174000'
        };

        // Execute WKN validation and get the validation chain
        const wknValidation = validation.validateStockCreation[2];
        await wknValidation(req as Request, res as Response, next as NextFunction);

        // Handle validation errors
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.calledWith(statusStub, 400);
        const errors = jsonSpy.firstCall.args[0].errors;
        expect(errors[0].msg).to.equal('Invalid WKN format');
      });
    });

    describe('validateStockSearch', () => {
      it('should validate valid search query', async () => {
        req.query = {
          query: 'AAPL'
        };

        for (const validator of validation.validateStockSearch.slice(0, -1)) {
          await validator(req as Request, res as Response, next as NextFunction);
        }
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.called(next);
        sinon.assert.notCalled(statusStub);
      });

      it('should reject empty search query', async () => {
        req.query = {
          query: ''
        };

        await validation.validateStockSearch[0](req as Request, res as Response, next as NextFunction);
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.calledWith(statusStub, 400);
        const errors = jsonSpy.firstCall.args[0].errors;
        expect(errors[0].msg).to.equal('Search query is required');
      });
    });
  });

  describe('Parameter Validation', () => {
    describe('validateUUID', () => {
      it('should validate valid UUID', async () => {
        req.params = {
          id: '123e4567-e89b-12d3-a456-426614174000'
        };

        const validators = validation.validateUUID('id');
        for (const validator of validators.slice(0, -1)) {
          await validator(req as Request, res as Response, next as NextFunction);
        }
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.called(next);
        sinon.assert.notCalled(statusStub);
      });

      it('should reject invalid UUID', async () => {
        req.params = {
          id: 'invalid-uuid'
        };

        const validators = validation.validateUUID('id');
        await validators[0](req as Request, res as Response, next as NextFunction);
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.calledWith(statusStub, 400);
        const errors = jsonSpy.firstCall.args[0].errors;
        expect(errors[0].msg).to.equal('Invalid id format');
      });
    });

    describe('validateIsin', () => {
      it('should validate valid ISIN', async () => {
        req.params = {
          isin: 'US0378331005'
        };

        const validators = validation.validateIsin('isin');
        for (const validator of validators.slice(0, -1)) {
          await validator(req as Request, res as Response, next as NextFunction);
        }
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.called(next);
        sinon.assert.notCalled(statusStub);
      });

      it('should reject invalid ISIN', async () => {
        req.params = {
          isin: 'invalid-isin'
        };

        const validators = validation.validateIsin('isin');
        await validators[0](req as Request, res as Response, next as NextFunction);
        validation.handleValidationErrors(req as Request, res as Response, next as NextFunction);

        sinon.assert.calledWith(statusStub, 400);
        const errors = jsonSpy.firstCall.args[0].errors;
        expect(errors[0].msg).to.equal('Invalid ISIN format');
      });
    });
  });
});
