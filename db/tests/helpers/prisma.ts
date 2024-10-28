import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

let prisma: PrismaClient | null = null;

export function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export async function createTestDatabase() {
  try {
    execSync('npx prisma db push --schema=./prisma/schema.test.prisma --force-reset', {
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('Error creating test database:', error);
    throw error;
  }
}

export async function clearDatabase() {
  const client = getPrismaClient();
  try {
    // Delete in order of dependencies (children first, then parents)
    await client.transaction.deleteMany();
    await client.holding.deleteMany();
    await client.portfolio.deleteMany();
    await client.quote.deleteMany();
    await client.stock.deleteMany();
    await client.category.deleteMany();
    await client.user.deleteMany();
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}

export async function closeDatabase() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
