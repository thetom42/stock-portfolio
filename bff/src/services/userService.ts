import { User, CreateUserDTO, UpdateUserDTO, UserCredentials } from '../models/User';
import { getPrismaClient } from '../utils/database';
import { createHash } from 'crypto';
import { UserRepository } from '@stock-portfolio/db';
import { User as DBUser } from '@prisma/client';

// Initialize repository with default implementation
const prisma = getPrismaClient();
let userRepository = new UserRepository(prisma);

// For testing: allow repository injection
export const setUserRepository = (repo: any) => {
    userRepository = repo;
};

// Helper function to map DB User to BFF User
const mapDBUserToBFF = (dbUser: DBUser): User => ({
  id: dbUser.user_id,
  email: dbUser.email,
  firstName: dbUser.name,
  lastName: dbUser.surname,
  createdAt: dbUser.join_date,
  updatedAt: dbUser.join_date // DB doesn't have updated_at, using join_date
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
      user_id: '', // Will be generated
      email: userData.email,
      name: userData.firstName,
      surname: userData.lastName,
      nickname: userData.firstName, // Using firstName as nickname
      password: hashedPassword,
      join_date: new Date()
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
      ...(updateData.email && { email: updateData.email }),
      ...(updateData.firstName && { name: updateData.firstName }),
      ...(updateData.lastName && { surname: updateData.lastName }),
      ...(updateData.firstName && { nickname: updateData.firstName }) // Update nickname if firstName changes
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
  if (hashedPassword !== user.password) {
    return null;
  }

  return mapDBUserToBFF(user);
};
