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
        user_id: 'test-id',
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        nickname: 'johnd',
        password: 'hashedPassword',
        join_date: new Date('2024-01-01'),
      };

      // Act
      const result = await userRepository.create(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.user_id).toBe(userData.user_id);
      expect(result.email).toBe(userData.email);
      
      // Verify the user was actually saved
      const savedUser = await prisma.user.findUnique({
        where: { user_id: userData.user_id }
      });
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe(userData.email);
    });

    it('should throw an error if email already exists', async () => {
      // Arrange
      const userData: User = {
        user_id: 'test-id',
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        nickname: 'johnd',
        password: 'hashedPassword',
        join_date: new Date('2024-01-01'),
      };
      await userRepository.create(userData);

      // Act & Assert
      const duplicateUser = { ...userData, user_id: 'different-id' };
      await expect(userRepository.create(duplicateUser))
        .rejects
        .toThrow('User with this email already exists');
    });
  });

  describe('findById', () => {
    it('should find a user by ID', async () => {
      // Arrange
      const userData: User = {
        user_id: 'test-id',
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        nickname: 'johnd',
        password: 'hashedPassword',
        join_date: new Date('2024-01-01'),
      };
      await prisma.user.create({ data: userData });

      // Act
      const result = await userRepository.findById(userData.user_id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.user_id).toBe(userData.user_id);
      expect(result?.email).toBe(userData.email);
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
        user_id: 'test-id',
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        nickname: 'johnd',
        password: 'hashedPassword',
        join_date: new Date('2024-01-01'),
      };
      await prisma.user.create({ data: userData });

      // Act
      const result = await userRepository.findByEmail(userData.email);

      // Assert
      expect(result).toBeDefined();
      expect(result?.user_id).toBe(userData.user_id);
      expect(result?.email).toBe(userData.email);
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
        user_id: 'test-id',
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        nickname: 'johnd',
        password: 'hashedPassword',
        join_date: new Date('2024-01-01'),
      };
      await prisma.user.create({ data: userData });

      const updateData = {
        name: 'John Updated',
        surname: 'Doe Updated',
      };

      // Act
      const result = await userRepository.update(userData.user_id, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.surname).toBe(updateData.surname);
      expect(result.email).toBe(userData.email); // Unchanged field

      // Verify the update was persisted
      const updatedUser = await prisma.user.findUnique({
        where: { user_id: userData.user_id }
      });
      expect(updatedUser?.name).toBe(updateData.name);
      expect(updatedUser?.surname).toBe(updateData.surname);
    });

    it('should throw an error if user does not exist', async () => {
      // Act & Assert
      await expect(userRepository.update('non-existent-id', { name: 'New Name' }))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      // Arrange
      const userData: User = {
        user_id: 'test-id',
        name: 'John',
        surname: 'Doe',
        email: 'john.doe@example.com',
        nickname: 'johnd',
        password: 'hashedPassword',
        join_date: new Date('2024-01-01'),
      };
      await prisma.user.create({ data: userData });

      // Act
      const result = await userRepository.delete(userData.user_id);

      // Assert
      expect(result).toBeDefined();
      expect(result.user_id).toBe(userData.user_id);

      // Verify the user was actually deleted
      const deletedUser = await prisma.user.findUnique({
        where: { user_id: userData.user_id }
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
