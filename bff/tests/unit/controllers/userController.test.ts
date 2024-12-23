import { expect } from 'chai';
import sinon from 'sinon';
import { userService } from '../../../src/services/userService';
import * as userController from '../../../src/controllers/userController';
import { CreateUserDTO, User } from '../../../src/models/User';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
describe('UserController', () => {
  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    res = createMockResponse();
    next = sinon.spy();
    // Stub userService methods
    sinon.stub(userService, 'createUser');
    sinon.stub(userService, 'getUserById');
    sinon.stub(userService, 'updateUser');
    sinon.stub(userService, 'deleteUser');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createUser', () => {
    const mockCreateData: CreateUserDTO = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password123'
    };

    it('should create a user and return 201 status', async () => {
      req = createMockRequest({ body: mockCreateData });
      const createdAt = new Date();
      const mockUser = {
        id: '1',
        email: mockCreateData.email,
        firstName: mockCreateData.firstName,
        lastName: mockCreateData.lastName,
        createdAt: createdAt,
        updatedAt: createdAt
      };
      (userService.createUser as sinon.SinonStub).resolves(mockUser);

      await userController.createUser(req as any, res, next);

      verifyResponse(res, 201, { user: mockUser });
    });

    it('should return 409 if email already exists', async () => {
      req = createMockRequest({ body: mockCreateData });
      (userService.createUser as sinon.SinonStub).rejects(new Error('Email already exists'));

      await userController.createUser(req as any, res, next);

      verifyResponse(res, 409, { error: 'Email already exists' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ body: mockCreateData });
      const error = new Error('Database error');
      (userService.createUser as sinon.SinonStub).rejects(error);

      await userController.createUser(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getUser', () => {
    it('should return user if found', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const createdAt = new Date();
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: createdAt,
        updatedAt: createdAt
      };
      (userService.getUserById as sinon.SinonStub).resolves(mockUser);

      await userController.getUser(req as any, res, next);

      verifyResponse(res, 200, { user: mockUser });
    });

    it('should return 404 if user not found', async () => {
      req = createMockRequest({ params: { id: '999' } });
      (userService.getUserById as sinon.SinonStub).resolves(null);

      await userController.getUser(req as any, res, next);

      verifyResponse(res, 404, { error: 'User not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const error = new Error('Database error');
      (userService.getUserById as sinon.SinonStub).rejects(error);

      await userController.getUser(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('updateUser', () => {
    const mockUpdateData = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    it('should update user successfully', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData
      });

      const createdAt = new Date();
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: mockUpdateData.firstName,
        lastName: mockUpdateData.lastName,
        createdAt: createdAt,
        updatedAt: createdAt
      };
      (userService.updateUser as sinon.SinonStub).resolves(mockUser);

      await userController.updateUser(req as any, res, next);

      verifyResponse(res, 200, { user: mockUser });
    });

    it('should return 404 if user not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        body: mockUpdateData
      });
      (userService.updateUser as sinon.SinonStub).resolves(null);

      await userController.updateUser(req as any, res, next);

      verifyResponse(res, 404, { error: 'User not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData
      });
      const error = new Error('Database error');
      (userService.updateUser as sinon.SinonStub).rejects(error);

      await userController.updateUser(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      (userService.deleteUser as sinon.SinonStub).resolves(mockUser);

      await userController.deleteUser(req as any, res, next);

      verifyResponse(res, 204);
    });

    it('should return 404 if user not found', async () => {
      req = createMockRequest({ params: { id: '999' } });
      (userService.deleteUser as sinon.SinonStub).rejects(new Error('User not found'));

      await userController.deleteUser(req as any, res, next);

      verifyResponse(res, 404, { error: 'User not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const error = new Error('Database error');
      (userService.deleteUser as sinon.SinonStub).rejects(error);

      await userController.deleteUser(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
