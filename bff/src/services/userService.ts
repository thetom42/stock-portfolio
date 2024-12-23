import { prisma, UserRepository } from '@stock-portfolio/db';
import type { User as DBUser } from '@stock-portfolio/db/dist/models/User';
import type { User, CreateUserDTO, UpdateUserDTO } from '../models/User';

// Helper function to map DB User to BFF User
const mapDBUserToBFF = (dbUser: DBUser): User => ({
  id: dbUser.user_id,
  email: dbUser.email,
  firstName: dbUser.name,        // Map name to firstName
  lastName: dbUser.surname,      // Map surname to lastName
  createdAt: dbUser.join_date,  // Map join_date to createdAt
  updatedAt: dbUser.join_date   // Using join_date as we don't have updated_at in DB
});

export class UserService {
  private userRepository: UserRepository;

  constructor(userRepo?: UserRepository) {
    this.userRepository = userRepo || new UserRepository(prisma);
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    return user ? mapDBUserToBFF(user) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    return user ? mapDBUserToBFF(user) : null;
  }

  async createUser(userData: CreateUserDTO): Promise<User> {
    const dbUser = await this.userRepository.create({
      user_id: crypto.randomUUID(),
      email: userData.email,
      name: userData.firstName,      // Map firstName to name
      surname: userData.lastName,    // Map lastName to surname
      password: userData.password,
      nickname: `${userData.firstName} ${userData.lastName}`, // Generate nickname
      join_date: new Date()
    });
    return mapDBUserToBFF(dbUser);
  }

  async updateUser(userId: string, userData: UpdateUserDTO): Promise<User> {
    const updateData: Partial<DBUser> = {};

    if (userData.firstName) updateData.name = userData.firstName;
    if (userData.lastName) updateData.surname = userData.lastName;
    if (userData.email) updateData.email = userData.email;

    const dbUser = await this.userRepository.update(userId, updateData);
    return mapDBUserToBFF(dbUser);
  }

  async deleteUser(userId: string): Promise<User> {
    const dbUser = await this.userRepository.delete(userId);
    return mapDBUserToBFF(dbUser);
  }
}

// Export a singleton instance
export const userService = new UserService();

// For testing: allow repository injection
export const setUserRepository = (repo: UserRepository) => {
  return new UserService(repo);
};
