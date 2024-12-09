import { PrismaClient } from '@prisma/client';
import { User } from '../models/User';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  async create(user: User): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: user
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw new Error('User with this email already exists');
      }
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { users_id: id }
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email }
    });
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    try {
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      return await this.prisma.user.update({
        where: { users_id: id },
        data: userData
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to update not found')) {
        throw new Error('User not found');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<User> {
    try {
      return await this.prisma.user.delete({
        where: { users_id: id }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
        throw new Error('User not found');
      }
      throw error;
    }
  }
}
