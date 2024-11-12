import { User, CreateUserDTO, UpdateUserDTO, UserCredentials } from '../models/User';
import { getPrismaClient } from '../utils/database';
import { createHash } from 'crypto';
import { UserRepository } from '../../../db/repositories/UserRepository';

// Initialize repository
const userRepository = new UserRepository(getPrismaClient());

// Helper function to map DB User to BFF User
const mapDBUserToBFF = (dbUser: any): User => ({
  id: dbUser.USERS_ID,
  email: dbUser.EMAIL,
  firstName: dbUser.NAME,
  lastName: dbUser.SURNAME,
  createdAt: dbUser.JOIN_DATE,
  updatedAt: dbUser.JOIN_DATE // DB doesn't have updated_at, using JOIN_DATE
});

// Helper function to hash password
const hashPassword = (password: string): string => {
  return createHash('sha256').update(password).digest('hex');
};

export const createUser = async (userData: CreateUserDTO): Promise<User> => {
  try {
    // Hash password
    const hashedPassword = hashPassword(userData.password);

    const dbUser = await userRepository.create({
      USERS_ID: '', // Will be generated
      EMAIL: userData.email,
      NAME: userData.firstName,
      SURNAME: userData.lastName,
      NICKNAME: userData.firstName, // Using firstName as nickname
      PASSWORD: hashedPassword,
      JOIN_DATE: new Date()
    });

    return mapDBUserToBFF(dbUser);
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw new Error('User with this email already exists');
    }
    throw error;
  }
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const user = await userRepository.findById(userId);
  
  if (!user) {
    return null;
  }

  return mapDBUserToBFF(user);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const user = await userRepository.findByEmail(email);
  
  if (!user) {
    return null;
  }

  return mapDBUserToBFF(user);
};

export const updateUser = async (
  userId: string,
  updateData: UpdateUserDTO
): Promise<User | null> => {
  try {
    // Build update data
    const updateFields: any = {
      ...(updateData.email && { EMAIL: updateData.email }),
      ...(updateData.firstName && { NAME: updateData.firstName }),
      ...(updateData.lastName && { SURNAME: updateData.lastName }),
      ...(updateData.firstName && { NICKNAME: updateData.firstName }) // Update nickname if firstName changes
    };

    const updatedUser = await userRepository.update(userId, updateFields);
    return mapDBUserToBFF(updatedUser);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return null;
    }
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await userRepository.delete(userId);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new Error('User not found');
    }
    throw error;
  }
};

export const validateUserCredentials = async (
  credentials: UserCredentials
): Promise<User | null> => {
  const user = await userRepository.findByEmail(credentials.email);

  if (!user) {
    return null;
  }

  // Verify password
  const hashedPassword = hashPassword(credentials.password);
  if (hashedPassword !== user.PASSWORD) {
    return null;
  }

  return mapDBUserToBFF(user);
};
