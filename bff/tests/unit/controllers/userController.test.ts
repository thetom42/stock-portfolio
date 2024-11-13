import { expect } from 'chai';
import sinon from 'sinon';
import * as userService from '../../../src/services/userService';
import * as userController from '../../../src/controllers/userController';
import { CreateUserDTO, User } from '../../../src/models/User';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
import { setupRepositoryMocks, resetRepositoryMocks, mockUserRepo } from '../../helpers/mockRepositories';

describe('UserController', () => {
  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    setupRepositoryMocks();
    res = createMockResponse();
    next = sinon.spy();
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  describe('createUser', () => {
    const mockCreateData: CreateUserDTO = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password123'
    };

    const mockCreatedUser: User = {
      id: '1',
      email: mockCreateData.email,
      firstName: mockCreateData.firstName,
      lastName: mockCreateData.lastName,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should create a user and return 201 status', async () => {
      req = createMockRequest({ body: mockCreateData });
      sinon.stub(userService, 'createUser').resolves(mockCreatedUser);

      await userController.createUser(req as any, res, next);

      verifyResponse(res, 201, { user: mockCreatedUser });
    });

    it('should return 409 if email already exists', async () => {
      req = createMockRequest({ body: mockCreateData });
      const error = new Error('Email already exists');
      sinon.stub(userService, 'createUser').rejects(error);

      await userController.createUser(req as any, res, next);

      verifyResponse(res, 409, { error: 'Email already exists' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ body: mockCreateData });
      const error = new Error('Database error');
      sinon.stub(userService, 'createUser').rejects(error);

      await userController.createUser(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
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
      req = createMockRequest({ params: { id: '1' } });
      sinon.stub(userService, 'getUserById').resolves(mockUser);

      await userController.getUser(req as any, res, next);

      verifyResponse(res, 200, { user: mockUser });
    });

    it('should return 404 if user not found', async () => {
      req = createMockRequest({ params: { id: '999' } });
      sinon.stub(userService, 'getUserById').resolves(null);

      await userController.getUser(req as any, res, next);

      verifyResponse(res, 404, { error: 'User not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const error = new Error('Database error');
      sinon.stub(userService, 'getUserById').rejects(error);

      await userController.getUser(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('updateUser', () => {
    const mockUpdateData = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    const mockUpdatedUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: mockUpdateData.firstName,
      lastName: mockUpdateData.lastName,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update user successfully', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData
      });
      sinon.stub(userService, 'updateUser').resolves(mockUpdatedUser);

      await userController.updateUser(req as any, res, next);

      verifyResponse(res, 200, { user: mockUpdatedUser });
    });

    it('should return 404 if user not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        body: mockUpdateData
      });
      sinon.stub(userService, 'updateUser').resolves(null);

      await userController.updateUser(req as any, res, next);

      verifyResponse(res, 404, { error: 'User not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData
      });
      const error = new Error('Database error');
      sinon.stub(userService, 'updateUser').rejects(error);

      await userController.updateUser(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      sinon.stub(userService, 'deleteUser').resolves();

      await userController.deleteUser(req as any, res, next);

      verifyResponse(res, 204);
    });

    it('should return 404 if user not found', async () => {
      req = createMockRequest({ params: { id: '999' } });
      const error = new Error('User not found');
      sinon.stub(userService, 'deleteUser').rejects(error);

      await userController.deleteUser(req as any, res, next);

      verifyResponse(res, 404, { error: 'User not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const error = new Error('Database error');
      sinon.stub(userService, 'deleteUser').rejects(error);

      await userController.deleteUser(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
