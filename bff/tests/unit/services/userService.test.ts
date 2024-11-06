import { expect, use } from 'chai';
import spies from 'chai-spies';
import { mockQueryResult, mockQuery, mockTransaction, resetMocks } from '../../helpers/mockDb';
import * as userService from '../../../src/services/userService';
import { CreateUserDTO, UpdateUserDTO, User } from '../../../src/models/User';

use(spies);

describe('UserService', () => {
  beforeEach(() => {
    resetMocks();
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
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should create a user successfully', async () => {
      mockQuery.resolves(mockQueryResult([mockCreatedUser]));

      const result = await userService.createUser(mockUserData);

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('INSERT INTO users');
      expect(mockQuery.firstCall.args[1]).to.deep.equal([
        mockUserData.email,
        mockUserData.firstName,
        mockUserData.lastName,
        mockUserData.password
      ]);
      expect(result).to.deep.equal(mockCreatedUser);
    });

    it('should throw error if database query fails', async () => {
      const error = new Error('Database error');
      mockQuery.rejects(error);

      try {
        await userService.createUser(mockUserData);
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('getUserById', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should return user if found', async () => {
      mockQuery.resolves(mockQueryResult([mockUser]));

      const result = await userService.getUserById('1');

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('SELECT');
      expect(mockQuery.firstCall.args[1]).to.deep.equal(['1']);
      expect(result).to.deep.equal(mockUser);
    });

    it('should return null if user not found', async () => {
      mockQuery.resolves(mockQueryResult([]));

      const result = await userService.getUserById('999');

      expect(mockQuery).to.have.been.called();
      expect(result).to.be.null;
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
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should update user successfully', async () => {
      mockQuery.resolves(mockQueryResult([mockUpdatedUser]));

      const result = await userService.updateUser('1', mockUpdateData);

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('UPDATE users');
      expect(mockQuery.firstCall.args[1]).to.deep.equal([
        mockUpdateData.firstName,
        mockUpdateData.lastName,
        '1'
      ]);
      expect(result).to.deep.equal(mockUpdatedUser);
    });

    it('should return null if user not found', async () => {
      mockQuery.resolves(mockQueryResult([]));

      const result = await userService.updateUser('999', mockUpdateData);

      expect(mockQuery).to.have.been.called();
      expect(result).to.be.null;
    });
  });

  describe('deleteUser', () => {
    it('should delete user and related data successfully', async () => {
      mockTransaction.resolves();

      await userService.deleteUser('1');

      expect(mockTransaction).to.have.been.called();
      const transactionCallback = mockTransaction.firstCall.args[0];
      expect(transactionCallback).to.be.a('function');
    });

    it('should throw error if deletion fails', async () => {
      const error = new Error('Database error');
      mockTransaction.rejects(error);

      try {
        await userService.deleteUser('1');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('validateUserCredentials', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password_hash: 'password123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    it('should return user if credentials are valid', async () => {
      mockQuery.resolves(mockQueryResult([mockUser]));

      const result = await userService.validateUserCredentials('test@example.com', 'password123');

      expect(mockQuery).to.have.been.called();
      expect(mockQuery.firstCall.args[0]).to.include('SELECT');
      expect(mockQuery.firstCall.args[1]).to.deep.equal(['test@example.com']);
      expect(result).to.deep.equal({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt
      });
    });

    it('should return null if user not found', async () => {
      mockQuery.resolves(mockQueryResult([]));

      const result = await userService.validateUserCredentials('nonexistent@example.com', 'password123');

      expect(mockQuery).to.have.been.called();
      expect(result).to.be.null;
    });

    it('should return null if password is incorrect', async () => {
      mockQuery.resolves(mockQueryResult([mockUser]));

      const result = await userService.validateUserCredentials('test@example.com', 'wrongpassword');

      expect(mockQuery).to.have.been.called();
      expect(result).to.be.null;
    });
  });
});
