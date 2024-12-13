import { PrismaClient } from '@prisma/client';
import { Portfolio } from '../models/Portfolio';
export declare class PortfolioRepository {
    private prisma;
    constructor(prisma: PrismaClient);
    create(portfolio: Portfolio): Promise<Portfolio>;
    findById(id: string): Promise<Portfolio | null>;
    findByUserId(userId: string): Promise<Portfolio[]>;
    update(id: string, portfolioData: Partial<Portfolio>): Promise<Portfolio>;
    delete(id: string): Promise<Portfolio>;
}
