import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import { 
  mockUserRepo,
  setupRepositoryMocks, 
  resetRepositoryMocks 
} from '../../helpers/mockRepositories';
import * as userService from '../../../src/services/userService';
import { CreateUserDTO, UpdateUserDTO, UserCredentials } from '../../../src/models/User';

use(spies);

describe('UserService', () => {
  beforeEach(() => {
    setupRepositoryMocks();
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
      PASSWORD: 'hashed_password', // actual hash will be handled by the service
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
      expect(mockUserRepo.create.calledOnce).to.be.true;
      const createCall = mockUserRepo.create.firstCall.args[0];
      expect(createCall).to.deep.include({
        USERS_ID: '',
        EMAIL: mockUserData.email,
        NAME: mockUserData.firstName,
        SURNAME: mockUserData.lastName,
        NICKNAME: mockUserData.firstName
      });
      // Don't test the exact hash value, just verify it's present
      expect(createCall.PASSWORD).to.be.a('string').and.not.empty;
      expect(createCall.JOIN_DATE).to.be.instanceOf(Date);
    });
  });

  describe('getUserById', () => {
    const mockDBUser = {
      USERS_ID: '1',
      EMAIL: 'test@example.com',
      NAME: 'Test',
      SURNAME: 'User',
      NICKNAME: 'Test',
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
      NAME: 'Test',
      SURNAME: 'User',
      NICKNAME: 'Test',
      JOIN_DATE: new Date()
    };

    const mockUpdatedDBUser = {
      ...mockDBUser,
      NAME: mockUpdateData.firstName,
      SURNAME: mockUpdateData.lastName,
      NICKNAME: mockUpdateData.firstName
    };

    it('should update user successfully', async () => {
      mockUserRepo.findById.resolves(mockDBUser);
      mockUserRepo.update.resolves(mockUpdatedDBUser);

      const result = await userService.updateUser('1', mockUpdateData);

      expect(result).to.deep.include({
        id: mockUpdatedDBUser.USERS_ID,
        email: mockUpdatedDBUser.EMAIL,
        firstName: mockUpdatedDBUser.NAME,
        lastName: mockUpdatedDBUser.SURNAME
      });
      expect(mockUserRepo.update.calledOnceWith('1', {
        NAME: mockUpdateData.firstName,
        SURNAME: mockUpdateData.lastName,
        NICKNAME: mockUpdateData.firstName
      })).to.be.true;
    });

    it('should return null if user not found', async () => {
      mockUserRepo.findById.resolves(null);

      const result = await userService.updateUser('999', mockUpdateData);
      expect(result).to.be.null;
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockUserRepo.delete.resolves();

      await userService.deleteUser('1');
      expect(mockUserRepo.delete.calledOnceWith('1')).to.be.true;
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
      PASSWORD: '', // will be set in beforeEach
      JOIN_DATE: new Date()
    };

    beforeEach(async () => {
      // Create a user and get their hashed password
      const tempUser = await userService.createUser({
        email: credentials.email,
        firstName: 'Test',
        lastName: 'User',
        password: credentials.password
      });
      mockDBUser.PASSWORD = mockUserRepo.create.firstCall.args[0].PASSWORD;
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
