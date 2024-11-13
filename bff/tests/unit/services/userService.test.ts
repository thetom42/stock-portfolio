import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import * as userService from '../../../src/services/userService';
import { User, CreateUserDTO, UpdateUserDTO, UserCredentials } from '../../../src/models/User';
import { mockUserRepo, setupRepositoryMocks, resetRepositoryMocks } from '../../helpers/mockRepositories';
import { createHash } from 'crypto';

describe('UserService', () => {
  beforeEach(() => {
    setupRepositoryMocks();
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  const mockUser = {
    USERS_ID: 'user123',
    EMAIL: 'test@example.com',
    NAME: 'John',
    SURNAME: 'Doe',
    NICKNAME: 'John',
    PASSWORD: createHash('sha256').update('password123').digest('hex'),
    JOIN_DATE: new Date()
  };

  const mockBFFUser: User = {
    id: mockUser.USERS_ID,
    email: mockUser.EMAIL,
    firstName: mockUser.NAME,
    lastName: mockUser.SURNAME,
    createdAt: mockUser.JOIN_DATE,
    updatedAt: mockUser.JOIN_DATE
  };

  describe('createUser', () => {
    const createUserDTO: CreateUserDTO = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123'
    };

    it('should create a user successfully', async () => {
      mockUserRepo.create.resolves(mockUser);

      const result = await userService.createUser(createUserDTO);

      expect(result).to.deep.equal(mockBFFUser);
      sinon.assert.calledOnce(mockUserRepo.create);
    });

    it('should throw error if user already exists', async () => {
      mockUserRepo.create.rejects(new Error('already exists'));

      await expect(userService.createUser(createUserDTO))
        .to.be.rejectedWith('User with this email already exists');
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      mockUserRepo.findById.resolves(mockUser);

      const result = await userService.getUserById('user123');

      expect(result).to.deep.equal(mockBFFUser);
      sinon.assert.calledWith(mockUserRepo.findById, 'user123');
    });

    it('should return null if user not found', async () => {
      mockUserRepo.findById.resolves(null);

      const result = await userService.getUserById('nonexistent');

      expect(result).to.be.null;
      sinon.assert.calledWith(mockUserRepo.findById, 'nonexistent');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user if found', async () => {
      mockUserRepo.findByEmail.resolves(mockUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(result).to.deep.equal(mockBFFUser);
      sinon.assert.calledWith(mockUserRepo.findByEmail, 'test@example.com');
    });

    it('should return null if user not found', async () => {
      mockUserRepo.findByEmail.resolves(null);

      const result = await userService.getUserByEmail('nonexistent@example.com');

      expect(result).to.be.null;
      sinon.assert.calledWith(mockUserRepo.findByEmail, 'nonexistent@example.com');
    });
  });

  describe('updateUser', () => {
    const updateData: UpdateUserDTO = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com'
    };

    it('should update user successfully', async () => {
      const updatedUser = {
        ...mockUser,
        NAME: 'Jane',
        SURNAME: 'Smith',
        EMAIL: 'jane@example.com',
        NICKNAME: 'Jane'
      };

      mockUserRepo.update.resolves(updatedUser);

      const result = await userService.updateUser('user123', updateData);

      expect(result).to.deep.equal({
        ...mockBFFUser,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com'
      });
      sinon.assert.calledWith(mockUserRepo.update, 'user123');
    });

    it('should return null if user not found', async () => {
      mockUserRepo.update.rejects(new Error('not found'));

      const result = await userService.updateUser('nonexistent', updateData);

      expect(result).to.be.null;
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepo.delete.resolves(mockUser);

      await userService.deleteUser('user123');

      sinon.assert.calledWith(mockUserRepo.delete, 'user123');
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.delete.rejects(new Error('not found'));

      await expect(userService.deleteUser('nonexistent'))
        .to.be.rejectedWith('User not found');
    });
  });

  describe('validateUserCredentials', () => {
    const credentials: UserCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should return user if credentials are valid', async () => {
      mockUserRepo.findByEmail.resolves(mockUser);

      const result = await userService.validateUserCredentials(credentials);

      expect(result).to.deep.equal(mockBFFUser);
      sinon.assert.calledWith(mockUserRepo.findByEmail, credentials.email);
    });

    it('should return null if user not found', async () => {
      mockUserRepo.findByEmail.resolves(null);

      const result = await userService.validateUserCredentials(credentials);

      expect(result).to.be.null;
      sinon.assert.calledWith(mockUserRepo.findByEmail, credentials.email);
    });

    it('should return null if password is incorrect', async () => {
      mockUserRepo.findByEmail.resolves(mockUser);

      const result = await userService.validateUserCredentials({
        ...credentials,
        password: 'wrongpassword'
      });

      expect(result).to.be.null;
      sinon.assert.calledWith(mockUserRepo.findByEmail, credentials.email);
    });
  });
});
