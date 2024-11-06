import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import { Request, Response } from 'express';
import * as transactionController from '../../../src/controllers/transactionController';
import { CreateTransactionDTO, Transaction } from '../../../src/models/Holding';
import { mockHoldingRepo, mockPortfolioRepo, mockTransactionRepo, setupRepositoryMocks, resetRepositoryMocks } from '../../helpers/mockRepositories';

use(spies);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
};

describe('TransactionController', () => {
  let req: Partial<Request>;
  let res: MockResponse;
  let next: any;

  const userId = 'user123';
  const holdingId = 'holding123';
  const portfolioId = 'portfolio123';

  beforeEach(() => {
    setupRepositoryMocks();
    res = {
      status: chai.spy(function(this: MockResponse, code: number) { return this; }),
      json: chai.spy()
    };
    next = chai.spy();
  });

  afterEach(() => {
    resetRepositoryMocks();
    chai.spy.restore();
    sinon.restore();
  });

  describe('createTransaction', () => {
    const mockTransactionData: CreateTransactionDTO = {
      AMOUNT: 100,
      PRICE: 150.50,
      BUY: true,
      COMMISSION: 7.99,
      BROKER: 'TEST_BROKER'
    };

    const mockHolding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: portfolioId,
      QUANTITY: 100,
      ISIN: 'US0378331005'
    };

    const mockTransaction = {
      TRANSACTIONS_ID: 'trans123',
      HOLDINGS_ID: holdingId,
      BUY: mockTransactionData.BUY,
      TRANSACTION_TIME: new Date(),
      AMOUNT: mockTransactionData.AMOUNT,
      PRICE: mockTransactionData.PRICE,
      COMMISSION: mockTransactionData.COMMISSION || 0,
      BROKER: mockTransactionData.BROKER || 'SYSTEM'
    };

    it('should create a buy transaction successfully', async () => {
      req = {
        user: { id: userId },
        params: { holdingId },
        body: mockTransactionData
      } as any;

      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.create.resolves(mockTransaction);
      mockHoldingRepo.update.resolves({ ...mockHolding, QUANTITY: 200 });

      await transactionController.createTransaction(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(201);
      expect(res.json).to.have.been.called.with(mockTransaction);
      expect(mockHoldingRepo.update).to.have.been.called();
    });

    it('should create a sell transaction successfully', async () => {
      const sellData = { ...mockTransactionData, BUY: false, AMOUNT: 50 };
      req = {
        user: { id: userId },
        params: { holdingId },
        body: sellData
      } as any;

      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.create.resolves({ ...mockTransaction, BUY: false, AMOUNT: 50 });
      mockHoldingRepo.update.resolves({ ...mockHolding, QUANTITY: 50 });

      await transactionController.createTransaction(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(201);
      expect(mockHoldingRepo.update).to.have.been.called();
    });

    it('should return 400 if selling more than owned', async () => {
      const sellData = { ...mockTransactionData, BUY: false, AMOUNT: 150 };
      req = {
        user: { id: userId },
        params: { holdingId },
        body: sellData
      } as any;

      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });

      await transactionController.createTransaction(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(400);
      expect(res.json).to.have.been.called.with({ 
        message: 'Insufficient holding quantity for sell transaction' 
      });
    });

    it('should return 404 if holding not found', async () => {
      req = {
        user: { id: userId },
        params: { holdingId },
        body: mockTransactionData
      } as any;

      mockHoldingRepo.findById.resolves(null);

      await transactionController.createTransaction(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Holding not found' });
    });
  });

  describe('getTransaction', () => {
    const transactionId = 'trans123';
    const mockTransaction = {
      TRANSACTIONS_ID: transactionId,
      HOLDINGS_ID: holdingId,
      BUY: true,
      TRANSACTION_TIME: new Date(),
      AMOUNT: 100,
      PRICE: 150.50,
      COMMISSION: 7.99,
      BROKER: 'TEST_BROKER'
    };

    it('should return transaction if authorized', async () => {
      req = {
        user: { id: userId },
        params: { id: transactionId }
      } as any;

      mockTransactionRepo.findById.resolves(mockTransaction);
      mockHoldingRepo.findById.resolves({ PORTFOLIOS_ID: portfolioId });
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });

      await transactionController.getTransaction(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockTransaction);
    });

    it('should return 404 if transaction not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' }
      } as any;

      mockTransactionRepo.findById.resolves(null);

      await transactionController.getTransaction(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Transaction not found' });
    });
  });

  describe('getTransactionsByHolding', () => {
    const mockTransactions = [
      {
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date(),
        AMOUNT: 100,
        PRICE: 150.50,
        COMMISSION: 7.99,
        BROKER: 'TEST_BROKER'
      }
    ];

    it('should return transactions for holding', async () => {
      req = {
        user: { id: userId },
        params: { holdingId }
      } as any;

      mockHoldingRepo.findById.resolves({ PORTFOLIOS_ID: portfolioId });
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockTransactions);
    });

    it('should return 404 if holding not found', async () => {
      req = {
        user: { id: userId },
        params: { holdingId }
      } as any;

      mockHoldingRepo.findById.resolves(null);

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Holding not found' });
    });
  });

  describe('getTransactionsByPortfolio', () => {
    const mockHoldings = [
      { HOLDINGS_ID: 'holding1', PORTFOLIOS_ID: portfolioId },
      { HOLDINGS_ID: 'holding2', PORTFOLIOS_ID: portfolioId }
    ];

    const mockTransactions = [
      {
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: 'holding1',
        BUY: true,
        TRANSACTION_TIME: new Date(),
        AMOUNT: 100,
        PRICE: 150.50,
        COMMISSION: 7.99,
        BROKER: 'TEST_BROKER'
      }
    ];

    it('should return transactions for portfolio', async () => {
      req = {
        user: { id: userId },
        params: { portfolioId }
      } as any;

      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockHoldingRepo.findByPortfolio.resolves(mockHoldings);
      mockTransactionRepo.findByHolding.resolves(mockTransactions);

      await transactionController.getTransactionsByPortfolio(req as any, res as any, next);

      expect(mockHoldingRepo.findByPortfolio).to.have.been.called();
      expect(mockTransactionRepo.findByHolding).to.have.been.called();
      expect(res.json).to.have.been.called();
    });

    it('should return 403 if portfolio not owned by user', async () => {
      req = {
        user: { id: userId },
        params: { portfolioId }
      } as any;

      mockPortfolioRepo.findById.resolves({ USERS_ID: 'different-user' });

      await transactionController.getTransactionsByPortfolio(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(403);
      expect(res.json).to.have.been.called.with({ message: 'Unauthorized' });
    });
  });
});
