import { expect, use } from 'chai';
import spies from 'chai-spies';
import { Request, Response } from 'express';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as userService from '../../../src/services/userService';
import * as userController from '../../../src/controllers/userController';
import { User, CreateUserDTO, UpdateUserDTO } from '../../../src/models/User';

use(spies);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('UserController', () => {
  let req: Partial<Request>;
  let res: MockResponse;
  let next: any;

  beforeEach(() => {
    res = {
      status: chai.spy(function(this: MockResponse, code: number) { return this; }),
      json: chai.spy(),
      send: chai.spy()
    };
    next = chai.spy();
  });

  afterEach(() => {
    chai.spy.restore();
  });

  describe('createUser', () => {
    const mockUserData: CreateUserDTO = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password123'
    };

    const mockCreatedUser: User = {
      id: '1',
      email: mockUserData.email,
      firstName: mockUserData.firstName,
      lastName: mockUserData.lastName,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a user and return 201 status', async () => {
      req = {
        body: mockUserData
      } as Request;

      chai.spy.on(userService, 'createUser', () => Promise.resolve(mockCreatedUser));

      await userController.createUser(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(201);
      expect(res.json).to.have.been.called.with(mockCreatedUser);
    });

    it('should call next with error if user creation fails', async () => {
      req = {
        body: mockUserData
      } as Request;

      const error = new Error('Database error');
      chai.spy.on(userService, 'createUser', () => Promise.reject(error));

      await userController.createUser(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });

  describe('getUser', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return user if found', async () => {
      req = {
        params: { id: '1' }
      } as Request<{ id: string }>;

      chai.spy.on(userService, 'getUserById', () => Promise.resolve(mockUser));

      await userController.getUser(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockUser);
    });

    it('should return 404 if user not found', async () => {
      req = {
        params: { id: '999' }
      } as Request<{ id: string }>;

      chai.spy.on(userService, 'getUserById', () => Promise.resolve(null));

      await userController.getUser(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'User not found' });
    });
  });

  describe('updateUser', () => {
    const mockUpdateData: UpdateUserDTO = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    const mockUpdatedUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Updated',
      lastName: 'Name',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update user and return updated data', async () => {
      req = {
        params: { id: '1' },
        body: mockUpdateData
      } as Request<{ id: string }>;

      chai.spy.on(userService, 'updateUser', () => Promise.resolve(mockUpdatedUser));

      await userController.updateUser(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockUpdatedUser);
    });

    it('should return 404 if user not found for update', async () => {
      req = {
        params: { id: '999' },
        body: mockUpdateData
      } as Request<{ id: string }>;

      chai.spy.on(userService, 'updateUser', () => Promise.resolve(null));

      await userController.updateUser(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'User not found' });
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return 204 status', async () => {
      req = {
        params: { id: '1' }
      } as Request<{ id: string }>;

      chai.spy.on(userService, 'deleteUser', () => Promise.resolve());

      await userController.deleteUser(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(204);
      expect(res.send).to.have.been.called();
    });

    it('should call next with error if deletion fails', async () => {
      req = {
        params: { id: '1' }
      } as Request<{ id: string }>;

      const error = new Error('Database error');
      chai.spy.on(userService, 'deleteUser', () => Promise.reject(error));

      await userController.deleteUser(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });

  describe('getOwnProfile', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return user profile if authenticated', async () => {
      req = {
        user: { id: '1' }
      } as any;

      chai.spy.on(userService, 'getUserById', () => Promise.resolve(mockUser));

      await userController.getOwnProfile(req as Request, res as any, next);

      expect(res.json).to.have.been.called.with(mockUser);
    });

    it('should return 401 if not authenticated', async () => {
      req = {} as Request;

      await userController.getOwnProfile(req as Request, res as any, next);

      expect(res.status).to.have.been.called.with(401);
      expect(res.json).to.have.been.called.with({ message: 'Unauthorized' });
    });

    it('should return 404 if user not found', async () => {
      req = {
        user: { id: '999' }
      } as any;

      chai.spy.on(userService, 'getUserById', () => Promise.resolve(null));

      await userController.getOwnProfile(req as Request, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'User not found' });
    });
  });

  describe('updateOwnProfile', () => {
    const mockUpdateData: UpdateUserDTO = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    const mockUpdatedUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Updated',
      lastName: 'Name',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update own profile if authenticated', async () => {
      req = {
        user: { id: '1' },
        body: mockUpdateData
      } as any;

      chai.spy.on(userService, 'updateUser', () => Promise.resolve(mockUpdatedUser));

      await userController.updateOwnProfile(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockUpdatedUser);
    });

    it('should return 401 if not authenticated', async () => {
      req = {
        body: mockUpdateData
      } as any;

      await userController.updateOwnProfile(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(401);
      expect(res.json).to.have.been.called.with({ message: 'Unauthorized' });
    });

    it('should return 404 if user not found', async () => {
      req = {
        user: { id: '999' },
        body: mockUpdateData
      } as any;

      chai.spy.on(userService, 'updateUser', () => Promise.resolve(null));

      await userController.updateOwnProfile(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'User not found' });
    });
  });
});
