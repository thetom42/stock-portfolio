import { PrismaClient } from '@prisma/client';
import { UserRepository } from '../../../repositories/UserRepository';
import { User } from '../../../models/User';
import { getPrismaClient, clearDatabase } from '../../helpers/prisma';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = getPrismaClient();
    userRepository = new UserRepository(prisma);
    await clearDatabase();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      // Arrange
      const userData: User = {
        USERS_ID: 'test-id',
        NAME: 'John',
        SURNAME: 'Doe',
        EMAIL: 'john.doe@example.com',
        NICKNAME: 'johnd',
        PASSWORD: 'hashedPassword',
        JOIN_DATE: new Date('2024-01-01'),
      };

      // Act
      const result = await userRepository.create(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.USERS_ID).toBe(userData.USERS_ID);
      expect(result.EMAIL).toBe(userData.EMAIL);
      
      // Verify the user was actually saved
      const savedUser = await prisma.user.findUnique({
        where: { USERS_ID: userData.USERS_ID }
      });
      expect(savedUser).toBeDefined();
      expect(savedUser?.EMAIL).toBe(userData.EMAIL);
    });

    it('should throw an error if email already exists', async () => {
      // Arrange
      const userData: User = {
        USERS_ID: 'test-id',
        NAME: 'John',
        SURNAME: 'Doe',
        EMAIL: 'john.doe@example.com',
        NICKNAME: 'johnd',
        PASSWORD: 'hashedPassword',
        JOIN_DATE: new Date('2024-01-01'),
      };
      await userRepository.create(userData);

      // Act & Assert
      const duplicateUser = { ...userData, USERS_ID: 'different-id' };
      await expect(userRepository.create(duplicateUser))
        .rejects
        .toThrow('User with this email already exists');
    });
  });

  describe('findById', () => {
    it('should find a user by ID', async () => {
      // Arrange
      const userData: User = {
        USERS_ID: 'test-id',
        NAME: 'John',
        SURNAME: 'Doe',
        EMAIL: 'john.doe@example.com',
        NICKNAME: 'johnd',
        PASSWORD: 'hashedPassword',
        JOIN_DATE: new Date('2024-01-01'),
      };
      await prisma.user.create({ data: userData });

      // Act
      const result = await userRepository.findById(userData.USERS_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result?.USERS_ID).toBe(userData.USERS_ID);
      expect(result?.EMAIL).toBe(userData.EMAIL);
    });

    it('should return null if user is not found', async () => {
      // Act
      const result = await userRepository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      // Arrange
      const userData: User = {
        USERS_ID: 'test-id',
        NAME: 'John',
        SURNAME: 'Doe',
        EMAIL: 'john.doe@example.com',
        NICKNAME: 'johnd',
        PASSWORD: 'hashedPassword',
        JOIN_DATE: new Date('2024-01-01'),
      };
      await prisma.user.create({ data: userData });

      // Act
      const result = await userRepository.findByEmail(userData.EMAIL);

      // Assert
      expect(result).toBeDefined();
      expect(result?.USERS_ID).toBe(userData.USERS_ID);
      expect(result?.EMAIL).toBe(userData.EMAIL);
    });

    it('should return null if user is not found', async () => {
      // Act
      const result = await userRepository.findByEmail('non-existent@email.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      // Arrange
      const userData: User = {
        USERS_ID: 'test-id',
        NAME: 'John',
        SURNAME: 'Doe',
        EMAIL: 'john.doe@example.com',
        NICKNAME: 'johnd',
        PASSWORD: 'hashedPassword',
        JOIN_DATE: new Date('2024-01-01'),
      };
      await prisma.user.create({ data: userData });

      const updateData = {
        NAME: 'John Updated',
        SURNAME: 'Doe Updated',
      };

      // Act
      const result = await userRepository.update(userData.USERS_ID, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.NAME).toBe(updateData.NAME);
      expect(result.SURNAME).toBe(updateData.SURNAME);
      expect(result.EMAIL).toBe(userData.EMAIL); // Unchanged field

      // Verify the update was persisted
      const updatedUser = await prisma.user.findUnique({
        where: { USERS_ID: userData.USERS_ID }
      });
      expect(updatedUser?.NAME).toBe(updateData.NAME);
      expect(updatedUser?.SURNAME).toBe(updateData.SURNAME);
    });

    it('should throw an error if user does not exist', async () => {
      // Act & Assert
      await expect(userRepository.update('non-existent-id', { NAME: 'New Name' }))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      // Arrange
      const userData: User = {
        USERS_ID: 'test-id',
        NAME: 'John',
        SURNAME: 'Doe',
        EMAIL: 'john.doe@example.com',
        NICKNAME: 'johnd',
        PASSWORD: 'hashedPassword',
        JOIN_DATE: new Date('2024-01-01'),
      };
      await prisma.user.create({ data: userData });

      // Act
      const result = await userRepository.delete(userData.USERS_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.USERS_ID).toBe(userData.USERS_ID);

      // Verify the user was actually deleted
      const deletedUser = await prisma.user.findUnique({
        where: { USERS_ID: userData.USERS_ID }
      });
      expect(deletedUser).toBeNull();
    });

    it('should throw an error if user does not exist', async () => {
      // Act & Assert
      await expect(userRepository.delete('non-existent-id'))
        .rejects
        .toThrow('User not found');
    });
  });
});
