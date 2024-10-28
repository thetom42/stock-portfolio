import { PrismaClient } from '@prisma/client';
import { Holding } from '../models/Holding';

export class HoldingRepository {
    constructor(private prisma: PrismaClient) {}

    private async validateHolding(holding: Partial<Holding>, isUpdate = false): Promise<void> {
        // Validate portfolio exists if provided
        if (holding.PORTFOLIOS_ID) {
            const portfolio = await this.prisma.portfolio.findUnique({
                where: { PORTFOLIOS_ID: holding.PORTFOLIOS_ID }
            });
            if (!portfolio) {
                throw new Error('Portfolio not found');
            }
        }

        // Validate stock exists if provided
        if (holding.ISIN) {
            const stock = await this.prisma.stock.findUnique({
                where: { ISIN: holding.ISIN }
            });
            if (!stock) {
                throw new Error('Stock not found');
            }
        }

        // Validate quantity if provided
        if (holding.QUANTITY !== undefined && holding.QUANTITY <= 0) {
            throw new Error('Quantity must be positive');
        }

        // Validate dates if both are provided
        if (holding.START_DATE && holding.END_DATE) {
            if (holding.START_DATE > holding.END_DATE) {
                throw new Error('Start date must be before end date');
            }
        }
    }

    async create(holding: Holding): Promise<Holding> {
        await this.validateHolding(holding);

        return this.prisma.holding.create({
            data: holding
        });
    }

    async findById(id: string): Promise<Holding | null> {
        return this.prisma.holding.findUnique({
            where: { HOLDINGS_ID: id }
        });
    }

    async findByPortfolio(portfolioId: string): Promise<Holding[]> {
        return this.prisma.holding.findMany({
            where: { PORTFOLIOS_ID: portfolioId },
            orderBy: { START_DATE: 'desc' }
        });
    }

    async findActiveByPortfolio(portfolioId: string): Promise<Holding[]> {
        return this.prisma.holding.findMany({
            where: { 
                PORTFOLIOS_ID: portfolioId,
                END_DATE: null
            },
            orderBy: { START_DATE: 'desc' }
        });
    }

    async findByStock(isin: string): Promise<Holding[]> {
        return this.prisma.holding.findMany({
            where: { ISIN: isin },
            orderBy: { START_DATE: 'desc' }
        });
    }

    async findActiveByStock(isin: string): Promise<Holding[]> {
        return this.prisma.holding.findMany({
            where: { 
                ISIN: isin,
                END_DATE: null
            },
            orderBy: { START_DATE: 'desc' }
        });
    }

    async update(id: string, data: Partial<Holding>): Promise<Holding> {
        const holding = await this.findById(id);
        if (!holding) {
            throw new Error('Holding not found');
        }

        // Validate the update data
        await this.validateHolding({ ...holding, ...data }, true);

        return this.prisma.holding.update({
            where: { HOLDINGS_ID: id },
            data
        });
    }

    async closeHolding(id: string, endDate: Date): Promise<Holding> {
        const holding = await this.findById(id);
        if (!holding) {
            throw new Error('Holding not found');
        }

        if (holding.END_DATE) {
            throw new Error('Holding is already closed');
        }

        if (endDate < holding.START_DATE) {
            throw new Error('End date must be after start date');
        }

        return this.prisma.holding.update({
            where: { HOLDINGS_ID: id },
            data: { END_DATE: endDate }
        });
    }

    async delete(id: string): Promise<Holding> {
        const holding = await this.findById(id);
        if (!holding) {
            throw new Error('Holding not found');
        }

        // Check if there are any transactions associated with this holding
        const transactionCount = await this.prisma.transaction.count({
            where: { HOLDINGS_ID: id }
        });

        if (transactionCount > 0) {
            throw new Error('Cannot delete holding with associated transactions');
        }

        return this.prisma.holding.delete({
            where: { HOLDINGS_ID: id }
        });
    }

    async updateQuantity(id: string, quantity: number): Promise<Holding> {
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }

        const holding = await this.findById(id);
        if (!holding) {
            throw new Error('Holding not found');
        }

        return this.prisma.holding.update({
            where: { HOLDINGS_ID: id },
            data: { QUANTITY: quantity }
        });
    }
}
