import { PrismaClient } from '@prisma/client';

// Mock PrismaClient instance
export const mockPrismaClient = {
    $disconnect: () => Promise.resolve(),
    holding: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve({}),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve({})
    },
    portfolio: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve({}),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve({})
    },
    transaction: {
        findUnique: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        create: () => Promise.resolve({}),
        update: () => Promise.resolve({}),
        delete: () => Promise.resolve({})
    }
} as unknown as PrismaClient;

// Export the mock database utility functions with explicit type annotations
export const getPrismaClient = (): PrismaClient => mockPrismaClient;

export const disconnectDatabase = async (): Promise<void> => {
    await mockPrismaClient.$disconnect();
};
