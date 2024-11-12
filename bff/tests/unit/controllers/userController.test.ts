import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chai from 'chai';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express-serve-static-core';
import * as userController from '../../../src/controllers/userController';
import * as database from '../../../src/utils/database';
import { createMockPrismaClient } from '../../helpers/mockPrisma';

chai.use(sinonChai);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('UserController', () => {
  let req: Partial<ExpressRequest>;
  let res: MockResponse;
  let next: sinon.SinonSpy;
  let statusStub: sinon.SinonSpy;
  let jsonStub: sinon.SinonSpy;
  let sendStub: sinon.SinonSpy;
  let mockPrismaClient: any;

  beforeEach(() => {
    statusStub = sinon.spy((code: number) => res);
    jsonStub = sinon.spy();
    sendStub = sinon.spy();
    
    res = {
      status: statusStub,
      json: jsonStub,
      send: sendStub
    };
    next = sinon.spy();

    mockPrismaClient = createMockPrismaClient();
    sinon.stub(database, 'getPrismaClient').returns(mockPrismaClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createUser', () => {
    const mockUser = {
      USERS_ID: '1',
      EMAIL: 'test@example.com',
      NAME: 'Test User',
      CREATED_AT: new Date(),
      UPDATED_AT: new Date()
    };

    it('should create a user and return 201 status', async () => {
      req = {
        body: {
          email: 'test@example.com',
          name: 'Test User'
        }
      } as any;

      mockPrismaClient.user.create.resolves(mockUser);

      await userController.createUser(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(201);
      expect(jsonStub).to.have.been.calledWith(mockUser);
    });

    it('should return 409 if email already exists', async () => {
      req = {
        body: {
          email: 'test@example.com',
          name: 'Test User'
        }
      } as any;

      const error = new Error('Unique constraint failed on the fields: (`EMAIL`)');
      mockPrismaClient.user.create.rejects(error);

      await userController.createUser(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(409);
      expect(jsonStub).to.have.been.calledWith({ error: 'Email already exists' });
    });

    it('should handle errors gracefully', async () => {
      req = {
        body: {
          email: 'test@example.com',
          name: 'Test User'
        }
      } as any;

      const error = new Error('Database error');
      mockPrismaClient.user.create.rejects(error);

      await userController.createUser(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });

  describe('getUser', () => {
    const mockUser = {
      USERS_ID: '1',
      EMAIL: 'test@example.com',
      NAME: 'Test User',
      CREATED_AT: new Date(),
      UPDATED_AT: new Date()
    };

    it('should return user if found', async () => {
      req = {
        params: { id: '1' },
        user: { id: '1' }
      } as any;

      mockPrismaClient.user.findUnique.resolves(mockUser);

      await userController.getUser(req as any, res as any, next);

      expect(jsonStub).to.have.been.calledWith(mockUser);
    });

    it('should return 404 if user not found', async () => {
      req = {
        params: { id: '999' },
        user: { id: '999' }
      } as any;

      mockPrismaClient.user.findUnique.resolves(null);

      await userController.getUser(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(404);
      expect(jsonStub).to.have.been.calledWith({ error: 'User not found' });
    });

    it('should handle errors gracefully', async () => {
      req = {
        params: { id: '1' },
        user: { id: '1' }
      } as any;

      const error = new Error('Database error');
      mockPrismaClient.user.findUnique.rejects(error);

      await userController.getUser(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });

  describe('updateUser', () => {
    const mockUser = {
      USERS_ID: '1',
      EMAIL: 'test@example.com',
      NAME: 'Test User',
      CREATED_AT: new Date(),
      UPDATED_AT: new Date()
    };

    it('should update user successfully', async () => {
      req = {
        params: { id: '1' },
        user: { id: '1' },
        body: {
          name: 'Updated Name'
        }
      } as any;

      mockPrismaClient.user.update.resolves({
        ...mockUser,
        NAME: 'Updated Name'
      });

      await userController.updateUser(req as any, res as any, next);

      expect(jsonStub).to.have.been.calledWith({
        ...mockUser,
        NAME: 'Updated Name'
      });
    });

    it('should return 404 if user not found', async () => {
      req = {
        params: { id: '999' },
        user: { id: '999' },
        body: {
          name: 'Updated Name'
        }
      } as any;

      mockPrismaClient.user.update.rejects(new Error('Record to update not found'));

      await userController.updateUser(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(404);
      expect(jsonStub).to.have.been.calledWith({ error: 'User not found' });
    });

    it('should handle errors gracefully', async () => {
      req = {
        params: { id: '1' },
        user: { id: '1' },
        body: {
          name: 'Updated Name'
        }
      } as any;

      const error = new Error('Database error');
      mockPrismaClient.user.update.rejects(error);

      await userController.updateUser(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      req = {
        params: { id: '1' },
        user: { id: '1' }
      } as any;

      mockPrismaClient.user.delete.resolves();

      await userController.deleteUser(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(204);
      expect(sendStub).to.have.been.called;
    });

    it('should return 404 if user not found', async () => {
      req = {
        params: { id: '999' },
        user: { id: '999' }
      } as any;

      mockPrismaClient.user.delete.rejects(new Error('Record to delete does not exist'));

      await userController.deleteUser(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(404);
      expect(jsonStub).to.have.been.calledWith({ error: 'User not found' });
    });

    it('should handle errors gracefully', async () => {
      req = {
        params: { id: '1' },
        user: { id: '1' }
      } as any;

      const error = new Error('Database error');
      mockPrismaClient.user.delete.rejects(error);

      await userController.deleteUser(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });
});
