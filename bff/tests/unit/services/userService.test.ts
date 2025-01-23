import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { UserService, setUserRepository } from '../../../src/services/userService';
import { User, CreateUserDTO, UpdateUserDTO } from '../../../src/models/User';
import { setupMockUserRepo, resetAllMocks } from '../../helpers/mockRepositories';

describe('UserService', () => {
  let mockRepo: any;
  let testUserService: UserService;

  beforeEach(() => {
    const setup = setupMockUserRepo();
    mockRepo = setup.mockRepo;
    // Create a new UserService instance with mock repository
    testUserService = setUserRepository(mockRepo);
  });

  afterEach(() => {
    resetAllMocks();
    sinon.restore();
  });

  const mockUser = {
    user_id: 'user123',
    email: 'test@example.com',
    name: 'John',
    surname: 'Doe',
    nickname: 'John',
    password: 'hashedpassword123',
    join_date: new Date()
  };

  const mockBFFUser: User = {
    id: mockUser.user_id,
    email: mockUser.email,
    firstName: mockUser.name,
    lastName: mockUser.surname,
    createdAt: mockUser.join_date,
    updatedAt: mockUser.join_date
  };

  describe('createUser', () => {
    const createUserDTO: CreateUserDTO = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: 'password123'
    };

    it('should create a user successfully', async () => {
      mockRepo.create.resolves(mockUser);

      const result = await testUserService.createUser(createUserDTO);

      expect(result).to.deep.equal(mockBFFUser);
      expect(mockRepo.create.firstCall.args[0]).to.deep.include({
        email: createUserDTO.email,
        name: createUserDTO.firstName,
        surname: createUserDTO.lastName,
        nickname: `${createUserDTO.firstName} ${createUserDTO.lastName}`
      });
      // Just verify password is a string, don't check exact value since it might be hashed
      expect(mockRepo.create.firstCall.args[0].password).to.be.a('string');
    });

    it('should throw error if user already exists', async () => {
      mockRepo.create.rejects(new Error('User with this email already exists'));

      await expect(testUserService.createUser(createUserDTO))
        .to.be.rejectedWith('User with this email already exists');
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      mockRepo.findById.resolves(mockUser);

      const result = await testUserService.getUserById('user123');

      expect(result).to.deep.equal(mockBFFUser);
      expect(mockRepo.findById.calledWith('user123')).to.be.true;
    });

    it('should return null if user not found', async () => {
      mockRepo.findById.resolves(null);

      const result = await testUserService.getUserById('nonexistent');

      expect(result).to.be.null;
      expect(mockRepo.findById.calledWith('nonexistent')).to.be.true;
    });
  });

  describe('getUserByEmail', () => {
    it('should return user if found', async () => {
      mockRepo.findByEmail.resolves(mockUser);

      const result = await testUserService.getUserByEmail('test@example.com');

      expect(result).to.deep.equal(mockBFFUser);
      expect(mockRepo.findByEmail.calledWith('test@example.com')).to.be.true;
    });

    it('should return null if user not found', async () => {
      mockRepo.findByEmail.resolves(null);

      const result = await testUserService.getUserByEmail('nonexistent@example.com');

      expect(result).to.be.null;
      expect(mockRepo.findByEmail.calledWith('nonexistent@example.com')).to.be.true;
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
        name: 'Jane',
        surname: 'Smith',
        email: 'jane@example.com'
      };

      mockRepo.update.resolves(updatedUser);

      const result = await testUserService.updateUser('user123', updateData);

      expect(result).to.deep.equal({
        ...mockBFFUser,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com'
      });

      expect(mockRepo.update.firstCall.args).to.deep.equal([
        'user123',
        {
          name: updateData.firstName,
          surname: updateData.lastName,
          email: updateData.email
        }
      ]);
    });

    it('should throw error if update fails', async () => {
      mockRepo.update.rejects(new Error('Failed to update user'));

      await expect(testUserService.updateUser('user123', updateData))
        .to.be.rejectedWith('Failed to update user');
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRepo.delete.resolves(mockUser);

      const result = await testUserService.deleteUser('user123');

      expect(result).to.deep.equal(mockBFFUser);
      expect(mockRepo.delete.calledWith('user123')).to.be.true;
    });

    it('should throw error if user not found', async () => {
      mockRepo.delete.rejects(new Error('User not found'));

      await expect(testUserService.deleteUser('nonexistent'))
        .to.be.rejectedWith('User not found');
    });
  });

  describe('ID Generation', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('should generate valid UUIDs for users', async () => {
      const mockDBUser = {
        user_id: '1',
        email: 'test@example.com',
        name: 'John',
        surname: 'Doe',
        nickname: 'John',
        password: 'hashedpassword123',
        join_date: new Date()
      };

      mockRepo.create.resolves(mockDBUser);
      await testUserService.createUser({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123'
      });

      // Verify the ID format in the database record
      const createArgs = mockRepo.create.firstCall.args[0];
      expect(createArgs.user_id).to.match(uuidRegex);
    });

    it('should generate unique user IDs', async () => {
      const ids = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const mockDBUser = {
          user_id: `mock-${i}`,
          email: `test${i}@example.com`,
          name: 'John',
          surname: 'Doe',
          nickname: 'John',
          password: 'hashedpassword123',
          join_date: new Date()
        };
        mockRepo.create.resolves(mockDBUser);

        await testUserService.createUser({
          email: `test${i}@example.com`,
          firstName: 'John',
          lastName: 'Doe',
          password: 'password123'
        });
        const createArgs = mockRepo.create.getCall(i).args[0];
        ids.add(createArgs.user_id);
      }

      expect(ids.size).to.equal(iterations);
    });

    it('should handle ID generation errors', async () => {
      mockRepo.create.rejects(new Error('ID generation failed'));

      await expect(testUserService.createUser({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123'
      })).to.be.rejectedWith('ID generation failed');
    });
  });
});
