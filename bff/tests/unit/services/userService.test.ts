import { expect } from 'chai';
import sinon from 'sinon';
import * as userService from '../../../src/services/userService';
import { CreateUserDTO, UpdateUserDTO, UserCredentials } from '../../../src/models/User';
import { 
  mockUserRepo,
  setupRepositoryMocks, 
  resetRepositoryMocks 
} from '../../helpers/mockRepositories';

describe('UserService', () => {
  beforeEach(() => {
    setupRepositoryMocks();
    // Replace the repository instance in the service
    (userService as any).userRepository = mockUserRepo;
  });

  afterEach(() => {
    resetRepositoryMocks();
  });

  describe('createUser', () => {
    const mockUserData: CreateUserDTO = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'password123'
    };

    const mockCreatedDBUser = {
      USERS_ID: '1',
      EMAIL: mockUserData.email,
      NAME: mockUserData.firstName,
      SURNAME: mockUserData.lastName,
      NICKNAME: mockUserData.firstName,
      PASSWORD: 'hashed_password',
      JOIN_DATE: new Date()
    };

    it('should create a user successfully', async () => {
      mockUserRepo.create.resolves(mockCreatedDBUser);

      const result = await userService.createUser(mockUserData);

      expect(result).to.deep.include({
        id: mockCreatedDBUser.USERS_ID,
        email: mockCreatedDBUser.EMAIL,
        firstName: mockCreatedDBUser.NAME,
        lastName: mockCreatedDBUser.SURNAME
      });

      const createCall = mockUserRepo.create.firstCall.args[0];
      expect(createCall).to.deep.include({
        USERS_ID: '',
        EMAIL: mockUserData.email,
        NAME: mockUserData.firstName,
        SURNAME: mockUserData.lastName,
        NICKNAME: mockUserData.firstName
      });
      expect(createCall.PASSWORD).to.be.a('string').and.not.empty;
      expect(createCall.JOIN_DATE).to.be.instanceOf(Date);
    });

    it('should throw error if user already exists', async () => {
      mockUserRepo.create.rejects(new Error('User with this email already exists'));

      await expect(userService.createUser(mockUserData))
        .to.be.rejectedWith('User with this email already exists');
    });
  });

  describe('getUserById', () => {
    const mockDBUser = {
      USERS_ID: '1',
      EMAIL: 'test@example.com',
      NAME: 'Test',
      SURNAME: 'User',
      NICKNAME: 'Test',
      PASSWORD: 'hashed_password',
      JOIN_DATE: new Date()
    };

    it('should return user if found', async () => {
      mockUserRepo.findById.resolves(mockDBUser);

      const result = await userService.getUserById('1');

      expect(result).to.deep.include({
        id: mockDBUser.USERS_ID,
        email: mockDBUser.EMAIL,
        firstName: mockDBUser.NAME,
        lastName: mockDBUser.SURNAME
      });
      expect(mockUserRepo.findById.calledWith('1')).to.be.true;
    });

    it('should return null if user not found', async () => {
      mockUserRepo.findById.resolves(null);

      const result = await userService.getUserById('999');
      expect(result).to.be.null;
    });
  });

  describe('getUserByEmail', () => {
    const mockDBUser = {
      USERS_ID: '1',
      EMAIL: 'test@example.com',
      NAME: 'Test',
      SURNAME: 'User',
      NICKNAME: 'Test',
      PASSWORD: 'hashed_password',
      JOIN_DATE: new Date()
    };

    it('should return user if found', async () => {
      mockUserRepo.findByEmail.resolves(mockDBUser);

      const result = await userService.getUserByEmail('test@example.com');

      expect(result).to.deep.include({
        id: mockDBUser.USERS_ID,
        email: mockDBUser.EMAIL,
        firstName: mockDBUser.NAME,
        lastName: mockDBUser.SURNAME
      });
      expect(mockUserRepo.findByEmail.calledWith('test@example.com')).to.be.true;
    });

    it('should return null if user not found', async () => {
      mockUserRepo.findByEmail.resolves(null);

      const result = await userService.getUserByEmail('nonexistent@example.com');
      expect(result).to.be.null;
    });
  });

  describe('updateUser', () => {
    const mockUpdateData: UpdateUserDTO = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    const mockDBUser = {
      USERS_ID: '1',
      EMAIL: 'test@example.com',
      NAME: 'Updated',
      SURNAME: 'Name',
      NICKNAME: 'Updated',
      PASSWORD: 'hashed_password',
      JOIN_DATE: new Date()
    };

    it('should update user successfully', async () => {
      mockUserRepo.update.resolves(mockDBUser);

      const result = await userService.updateUser('1', mockUpdateData);

      expect(result).to.deep.include({
        id: mockDBUser.USERS_ID,
        email: mockDBUser.EMAIL,
        firstName: mockDBUser.NAME,
        lastName: mockDBUser.SURNAME
      });

      expect(mockUserRepo.update.calledWith('1', {
        NAME: mockUpdateData.firstName,
        SURNAME: mockUpdateData.lastName,
        NICKNAME: mockUpdateData.firstName
      })).to.be.true;
    });

    it('should return null if user not found', async () => {
      mockUserRepo.update.rejects(new Error('User not found'));

      const result = await userService.updateUser('999', mockUpdateData);
      expect(result).to.be.null;
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepo.delete.resolves({} as any);

      await userService.deleteUser('1');
      expect(mockUserRepo.delete.calledWith('1')).to.be.true;
    });

    it('should throw error if user not found', async () => {
      mockUserRepo.delete.rejects(new Error('User not found'));

      await expect(userService.deleteUser('999'))
        .to.be.rejectedWith('User not found');
    });
  });

  describe('validateUserCredentials', () => {
    const credentials: UserCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    const mockDBUser = {
      USERS_ID: '1',
      EMAIL: credentials.email,
      NAME: 'Test',
      SURNAME: 'User',
      NICKNAME: 'Test',
      PASSWORD: '', // Will be set to match hashed password
      JOIN_DATE: new Date()
    };

    beforeEach(() => {
      // Set the password to match the hashed version of the test password
      const crypto = require('crypto');
      mockDBUser.PASSWORD = crypto.createHash('sha256').update(credentials.password).digest('hex');
    });

    it('should return user if credentials are valid', async () => {
      mockUserRepo.findByEmail.resolves(mockDBUser);

      const result = await userService.validateUserCredentials(credentials);

      expect(result).to.deep.include({
        id: mockDBUser.USERS_ID,
        email: mockDBUser.EMAIL,
        firstName: mockDBUser.NAME,
        lastName: mockDBUser.SURNAME
      });
    });

    it('should return null if user not found', async () => {
      mockUserRepo.findByEmail.resolves(null);

      const result = await userService.validateUserCredentials({
        email: 'nonexistent@example.com',
        password: 'password123'
      });
      expect(result).to.be.null;
    });

    it('should return null if password is incorrect', async () => {
      mockUserRepo.findByEmail.resolves(mockDBUser);

      const result = await userService.validateUserCredentials({
        email: credentials.email,
        password: 'wrongpassword'
      });
      expect(result).to.be.null;
    });
  });
});
