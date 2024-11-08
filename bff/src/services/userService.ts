import { User, CreateUserDTO, UpdateUserDTO, UserCredentials } from '../models/User';
import { getUserRepository } from '../utils/database';
import { createHash } from 'crypto';

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
  const userRepo = getUserRepository();

  // Hash password
  const hashedPassword = hashPassword(userData.password);

  const dbUser = await userRepo.create({
    USERS_ID: '', // Will be generated
    EMAIL: userData.email,
    NAME: userData.firstName,
    SURNAME: userData.lastName,
    NICKNAME: userData.firstName, // Using firstName as nickname
    PASSWORD: hashedPassword,
    JOIN_DATE: new Date()
  });

  return mapDBUserToBFF(dbUser);
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const userRepo = getUserRepository();
  const user = await userRepo.findById(userId);
  
  if (!user) {
    return null;
  }

  return mapDBUserToBFF(user);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const userRepo = getUserRepository();
  const user = await userRepo.findByEmail(email);
  
  if (!user) {
    return null;
  }

  return mapDBUserToBFF(user);
};

export const updateUser = async (
  userId: string,
  updateData: UpdateUserDTO
): Promise<User | null> => {
  const userRepo = getUserRepository();
  
  // First check if user exists
  const existingUser = await userRepo.findById(userId);
  if (!existingUser) {
    return null;
  }

  // Build update data
  const updateFields: any = {
    ...(updateData.email && { EMAIL: updateData.email }),
    ...(updateData.firstName && { NAME: updateData.firstName }),
    ...(updateData.lastName && { SURNAME: updateData.lastName }),
    ...(updateData.firstName && { NICKNAME: updateData.firstName }) // Update nickname if firstName changes
  };

  const updatedUser = await userRepo.update(userId, updateFields);
  return mapDBUserToBFF(updatedUser);
};

export const deleteUser = async (userId: string): Promise<void> => {
  const userRepo = getUserRepository();
  await userRepo.delete(userId);
};

export const validateUserCredentials = async (
  credentials: UserCredentials
): Promise<User | null> => {
  const userRepo = getUserRepository();
  const user = await userRepo.findByEmail(credentials.email);

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
