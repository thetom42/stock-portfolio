import type { Request, Response, NextFunction, AuthUser } from '../../src/types/express';
import { PrismaClient } from '@prisma/client';
import sinon, { SinonStub } from 'sinon';

interface MockRepository {
  findUnique: SinonStub;
  findMany: SinonStub;
  create: SinonStub;
  update: SinonStub;
  delete: SinonStub;
  findByName?: SinonStub;
  findById?: SinonStub;
  findAll?: SinonStub;
  findByPortfolio?: SinonStub;
  findByHolding?: SinonStub;
  findByEmail?: SinonStub;
}

export const createMockNext = (): NextFunction => 
  sinon.stub().callsFake((error?: any) => {
    if (error) throw error;
  }) as unknown as NextFunction;

export const createMockRepositories = () => {
  const createMockRepo = (): MockRepository => ({
    findUnique: sinon.stub(),
    findMany: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    delete: sinon.stub(),
    findByName: sinon.stub(),
    findById: sinon.stub(),
    findAll: sinon.stub(),
    findByPortfolio: sinon.stub(),
    findByHolding: sinon.stub(),
    findByEmail: sinon.stub()
  });

  return {
    mockHoldingRepo: createMockRepo(),
    mockPortfolioRepo: createMockRepo(),
    mockStockRepo: createMockRepo(),
    mockUserRepo: createMockRepo(),
    mockQuoteRepo: createMockRepo(),
    mockTransactionRepo: createMockRepo(),
    mockCategoryRepo: createMockRepo()
  };
};

export const resetMocks = (...mocks: MockRepository[]) => {
  mocks.forEach(mock => {
    Object.values(mock).forEach(method => {
      if (method && typeof method.reset === 'function') {
        method.reset();
      }
    });
  });
};

export const mockPrismaClient = (stubs: Partial<PrismaClient> = {}): PrismaClient => {
  return {
    $connect: sinon.stub().resolves(),
    $disconnect: sinon.stub().resolves(),
    $transaction: sinon.stub().callsFake(async (fn) => await fn(mockPrismaClient())),
    ...stubs
  } as unknown as PrismaClient;
};
