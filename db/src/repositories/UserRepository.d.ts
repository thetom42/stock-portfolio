import { PrismaClient } from '@prisma/client';
import { User } from '../models/User';
export declare class UserRepository {
    private prisma;
    constructor(prisma: PrismaClient);
    create(user: User): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, userData: Partial<User>): Promise<User>;
    delete(id: string): Promise<User>;
}
