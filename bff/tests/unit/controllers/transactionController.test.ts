import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chai from 'chai';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express-serve-static-core';
import * as transactionController from '../../../src/controllers/transactionController';
import * as database from '../../../src/utils/database';
import { createMockPrismaClient } from '../../helpers/mockPrisma';

chai.use(sinonChai);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('TransactionController', () => {
  let req: Partial<ExpressRequest>;
  let res: MockResponse;
  let next: sinon.SinonSpy;
  let statusStub: sinon.SinonSpy;
  let jsonStub: sinon.SinonSpy;
  let sendStub: sinon.SinonSpy;
  let mockPrismaClient: any;

  beforeEach(() => {
    statusStub = sinon.spy((code: number) => res);
    jsonStub = sinon.spy();
    sendStub = sinon.spy();
    
    res = {
      status: statusStub,
      json: jsonStub,
      send: sendStub
    };
    next = sinon.spy();

    mockPrismaClient = createMockPrismaClient();
    sinon.stub(database, 'getPrismaClient').returns(mockPrismaClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createTransaction', () => {
    const mockTransaction = {
      TRANSACTIONS_ID: '1',
      HOLDINGS_ID: '1',
      BUY: true,
      AMOUNT: 10,
      PRICE: 150.50,
      TRANSACTION_TIME: new Date(),
      COMMISSION: 9.99,
      BROKER: 'Test Broker'
    };

    const mockHolding = {
      HOLDINGS_ID: '1',
      PORTFOLIOS_ID: '1',
      ISIN: 'US0378331005',
      QUANTITY: 10,
      START_DATE: new Date(),
      END_DATE: null
    };

    const mockPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    it('should create a buy transaction successfully', async () => {
      req = {
        params: { holdingId: '1' },
        body: {
          BUY: true,
          AMOUNT: 10,
          PRICE: 150.50,
          COMMISSION: 9.99,
          BROKER: 'Test Broker'
        },
        user: { id: 'user1' }
      } as any;

      mockPrismaClient.holding.findUnique.resolves(mockHolding);
      mockPrismaClient.portfolio.findUnique.resolves(mockPortfolio);
      mockPrismaClient.transaction.create.resolves(mockTransaction);

      await transactionController.createTransaction(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(201);
      expect(jsonStub).to.have.been.calledWith(mockTransaction);
    });

    it('should return 404 if holding not found', async () => {
      req = {
        params: { holdingId: '999' },
        body: {
          BUY: true,
          AMOUNT: 10,
          PRICE: 150.50
        },
        user: { id: 'user1' }
      } as any;

      mockPrismaClient.holding.findUnique.resolves(null);

      await transactionController.createTransaction(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(404);
      expect(jsonStub).to.have.been.calledWith({ error: 'Holding not found' });
    });

    it('should return 403 if user is not authorized', async () => {
      req = {
        params: { holdingId: '1' },
        body: {
          BUY: true,
          AMOUNT: 10,
          PRICE: 150.50
        },
        user: { id: 'user2' }
      } as any;

      mockPrismaClient.holding.findUnique.resolves(mockHolding);
      mockPrismaClient.portfolio.findUnique.resolves(mockPortfolio);

      await transactionController.createTransaction(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(403);
      expect(jsonStub).to.have.been.calledWith({ error: 'Unauthorized' });
    });

    it('should handle errors gracefully', async () => {
      req = {
        params: { holdingId: '1' },
        body: {
          BUY: true,
          AMOUNT: 10,
          PRICE: 150.50
        },
        user: { id: 'user1' }
      } as any;

      const error = new Error('Database error');
      mockPrismaClient.holding.findUnique.rejects(error);

      await transactionController.createTransaction(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });

  describe('getTransactionsByHolding', () => {
    const mockTransactions = [
      {
        TRANSACTIONS_ID: '1',
        HOLDINGS_ID: '1',
        BUY: true,
        AMOUNT: 10,
        PRICE: 150.50,
        TRANSACTION_TIME: new Date(),
        COMMISSION: 9.99,
        BROKER: 'Test Broker'
      }
    ];

    const mockHolding = {
      HOLDINGS_ID: '1',
      PORTFOLIOS_ID: '1',
      ISIN: 'US0378331005',
      QUANTITY: 10,
      START_DATE: new Date(),
      END_DATE: null
    };

    const mockPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    it('should return transactions for authorized user', async () => {
      req = {
        params: { holdingId: '1' },
        user: { id: 'user1' }
      } as any;

      mockPrismaClient.holding.findUnique.resolves(mockHolding);
      mockPrismaClient.portfolio.findUnique.resolves(mockPortfolio);
      mockPrismaClient.transaction.findMany.resolves(mockTransactions);

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      expect(jsonStub).to.have.been.calledWith(mockTransactions);
    });

    it('should return 404 if holding not found', async () => {
      req = {
        params: { holdingId: '999' },
        user: { id: 'user1' }
      } as any;

      mockPrismaClient.holding.findUnique.resolves(null);

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(404);
      expect(jsonStub).to.have.been.calledWith({ error: 'Holding not found' });
    });

    it('should return 403 if user is not authorized', async () => {
      req = {
        params: { holdingId: '1' },
        user: { id: 'user2' }
      } as any;

      mockPrismaClient.holding.findUnique.resolves(mockHolding);
      mockPrismaClient.portfolio.findUnique.resolves(mockPortfolio);

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(403);
      expect(jsonStub).to.have.been.calledWith({ error: 'Unauthorized' });
    });

    it('should handle errors gracefully', async () => {
      req = {
        params: { holdingId: '1' },
        user: { id: 'user1' }
      } as any;

      const error = new Error('Database error');
      mockPrismaClient.holding.findUnique.rejects(error);

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });
});
