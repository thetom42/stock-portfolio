import { PrismaClient } from '@prisma/client';
import { Holding } from '../models/Holding';
export declare class HoldingRepository {
    private prisma;
    constructor(prisma: PrismaClient);
    create(holding: Holding): Promise<Holding>;
    findById(id: string): Promise<Holding | null>;
    findByPortfolioId(portfolioId: string): Promise<Holding[]>;
    findActiveByPortfolioId(portfolioId: string): Promise<Holding[]>;
    update(id: string, holdingData: Partial<Holding>): Promise<Holding>;
    delete(id: string): Promise<Holding>;
}
