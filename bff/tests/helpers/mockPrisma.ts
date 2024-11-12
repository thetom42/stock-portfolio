import { PrismaClient } from '@prisma/client';
import sinon from 'sinon';

export const createMockPrismaClient = () => {
  return {
    portfolio: {
      create: sinon.stub(),
      findUnique: sinon.stub(),
      findMany: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub()
    },
    holding: {
      create: sinon.stub(),
      findUnique: sinon.stub(),
      findMany: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub()
    },
    transaction: {
      create: sinon.stub(),
      findUnique: sinon.stub(),
      findMany: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub()
    },
    stock: {
      create: sinon.stub(),
      findUnique: sinon.stub(),
      findMany: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub()
    },
    quote: {
      create: sinon.stub(),
      findUnique: sinon.stub(),
      findMany: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub()
    },
    category: {
      create: sinon.stub(),
      findUnique: sinon.stub(),
      findMany: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub()
    },
    user: {
      create: sinon.stub(),
      findUnique: sinon.stub(),
      findMany: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub()
    },
    $connect: sinon.stub().resolves(),
    $disconnect: sinon.stub().resolves(),
    $transaction: sinon.stub().callsFake(async (fn) => await fn(this))
  } as unknown as PrismaClient;
};

export const resetMockPrismaClient = (client: PrismaClient) => {
  const mockClient = client as any;
  Object.values(mockClient).forEach(value => {
    if (value && typeof value === 'object') {
      Object.values(value).forEach(method => {
        if (method && typeof method.reset === 'function') {
          method.reset();
        }
      });
    }
  });
};
