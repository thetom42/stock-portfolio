import { prisma, PrismaClient } from '@stock-portfolio/db';

let prismaClient: PrismaClient | null = prisma;

export function getPrismaClient(): PrismaClient {
  if (!prismaClient) {
    prismaClient = prisma;
  }
  return prismaClient;
}

export async function disconnectDatabase(): Promise<void> {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
}
