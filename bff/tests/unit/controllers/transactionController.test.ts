import { expect } from 'chai';
import sinon from 'sinon';
import { transactionService } from '../../../src/services/transactionService';
import { holdingService } from '../../../src/services/holdingService';
import { portfolioService } from '../../../src/services/portfolioService';
import * as transactionController from '../../../src/controllers/transactionController';
import { Transaction, CreateTransactionDTO, PaginatedTransactions } from '../../../src/models/Transaction';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';

describe('TransactionController', () => {
  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;

  const mockPortfolio = {
    id: 'portfolio1',
    userId: 'user1',
    name: 'Test Portfolio',
    createdAt: new Date()
  };

  const mockHolding = {
    id: 'holding1',
    portfolioId: 'portfolio1',
    isin: 'US0378331005',
    quantity: 100,
    startDate: new Date(),
    endDate: null,
    stock: { symbol: 'AAPL', name: 'Apple Inc.', currency: 'USD' },
    currentPrice: 150,
    totalValue: 15000,
    gainLoss: 500,
    gainLossPercentage: 3.45
  };

  const mockTransaction: Transaction = {
    id: 'transaction1',
    holdingId: 'holding1',
    buy: true,
    amount: 10,
    price: 150.50,
    commission: 9.99,
    broker: 'Test Broker',
    transactionTime: new Date()
  };

  beforeEach(() => {
    res = createMockResponse();
    next = sinon.spy();
    // Stub transactionService methods
    sinon.stub(transactionService, 'createTransaction');
    sinon.stub(transactionService, 'getTransactionById');
    sinon.stub(transactionService, 'getTransactionsByHolding');
    sinon.stub(transactionService, 'getTransactionsByPortfolio');
    // Stub holdingService for ownership checks
    sinon.stub(holdingService, 'getHoldingById');
    // Stub portfolioService for ownership checks
    sinon.stub(portfolioService, 'getPortfolioById');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createTransaction', () => {
    const mockCreateData: CreateTransactionDTO = {
      amount: 10,
      price: 150.50,
      buy: true,
      commission: 9.99,
      broker: 'Test Broker'
    };

    it('should create a transaction successfully', async () => {
      req = createMockRequest({
        params: { holdingId: 'holding1' },
        body: mockCreateData,
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(mockPortfolio);
      (transactionService.createTransaction as sinon.SinonStub).resolves(mockTransaction);

      await transactionController.createTransaction(req as any, res as any, next);

      verifyResponse(res, 201, { transaction: mockTransaction });
      sinon.assert.calledWith(
        transactionService.createTransaction as sinon.SinonStub,
        'holding1',
        mockCreateData
      );
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { holdingId: 'nonexistent' },
        body: mockCreateData,
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await transactionController.createTransaction(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({
        params: { holdingId: 'holding1' },
        body: mockCreateData,
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        ...mockPortfolio,
        userId: 'other-user'
      });

      await transactionController.createTransaction(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should return 403 if portfolio not found', async () => {
      req = createMockRequest({
        params: { holdingId: 'holding1' },
        body: mockCreateData,
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(null);

      await transactionController.createTransaction(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should return 400 for insufficient holding quantity', async () => {
      req = createMockRequest({
        params: { holdingId: 'holding1' },
        body: { ...mockCreateData, buy: false, amount: 1000 },
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(mockPortfolio);
      (transactionService.createTransaction as sinon.SinonStub).rejects(
        new Error('Insufficient holding quantity for sell transaction')
      );

      await transactionController.createTransaction(req as any, res as any, next);

      verifyResponse(res, 400, { error: 'Insufficient holding quantity for sell transaction' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { holdingId: 'holding1' },
        body: mockCreateData,
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(mockPortfolio);
      const error = new Error('Database error');
      (transactionService.createTransaction as sinon.SinonStub).rejects(error);

      await transactionController.createTransaction(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getTransaction', () => {
    it('should return transaction if found and user owns it', async () => {
      req = createMockRequest({
        params: { id: 'transaction1' },
        user: { id: 'user1' }
      });

      (transactionService.getTransactionById as sinon.SinonStub).resolves(mockTransaction);
      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(mockPortfolio);

      await transactionController.getTransaction(req as any, res as any, next);

      verifyResponse(res, 200, { transaction: mockTransaction });
    });

    it('should return 404 if transaction not found', async () => {
      req = createMockRequest({
        params: { id: 'nonexistent' },
        user: { id: 'user1' }
      });

      (transactionService.getTransactionById as sinon.SinonStub).resolves(null);

      await transactionController.getTransaction(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Transaction not found' });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { id: 'transaction1' },
        user: { id: 'user1' }
      });

      (transactionService.getTransactionById as sinon.SinonStub).resolves(mockTransaction);
      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await transactionController.getTransaction(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({
        params: { id: 'transaction1' },
        user: { id: 'user1' }
      });

      (transactionService.getTransactionById as sinon.SinonStub).resolves(mockTransaction);
      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        ...mockPortfolio,
        userId: 'other-user'
      });

      await transactionController.getTransaction(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should return 403 if portfolio not found', async () => {
      req = createMockRequest({
        params: { id: 'transaction1' },
        user: { id: 'user1' }
      });

      (transactionService.getTransactionById as sinon.SinonStub).resolves(mockTransaction);
      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(null);

      await transactionController.getTransaction(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { id: 'transaction1' },
        user: { id: 'user1' }
      });

      const error = new Error('Database error');
      (transactionService.getTransactionById as sinon.SinonStub).rejects(error);

      await transactionController.getTransaction(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getTransactionsByHolding', () => {
    const mockPaginatedTransactions: PaginatedTransactions = {
      transactions: [mockTransaction],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('should return transactions for authorized user', async () => {
      req = createMockRequest({
        params: { holdingId: 'holding1' },
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: '1',
          limit: '10'
        },
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(mockPortfolio);
      (transactionService.getTransactionsByHolding as sinon.SinonStub).resolves(mockPaginatedTransactions);

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      verifyResponse(res, 200, mockPaginatedTransactions);
      sinon.assert.calledWith(
        transactionService.getTransactionsByHolding as sinon.SinonStub,
        'holding1',
        {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          type: undefined,
          sort: undefined,
          order: undefined,
          page: 1,
          limit: 10
        }
      );
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { holdingId: 'nonexistent' },
        query: {},
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({
        params: { holdingId: 'holding1' },
        query: {},
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        ...mockPortfolio,
        userId: 'other-user'
      });

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should return 403 if portfolio not found', async () => {
      req = createMockRequest({
        params: { holdingId: 'holding1' },
        query: {},
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(null);

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { holdingId: 'holding1' },
        query: {},
        user: { id: 'user1' }
      });

      (holdingService.getHoldingById as sinon.SinonStub).resolves(mockHolding);
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(mockPortfolio);
      const error = new Error('Database error');
      (transactionService.getTransactionsByHolding as sinon.SinonStub).rejects(error);

      await transactionController.getTransactionsByHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getTransactionsByPortfolio', () => {
    const mockPaginatedTransactions: PaginatedTransactions = {
      transactions: [mockTransaction],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('should return transactions for authorized user', async () => {
      req = createMockRequest({
        params: { portfolioId: 'portfolio1' },
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          type: 'BUY',
          sort: 'date',
          order: 'desc',
          page: '1',
          limit: '10'
        },
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(mockPortfolio);
      (transactionService.getTransactionsByPortfolio as sinon.SinonStub).resolves(mockPaginatedTransactions);

      await transactionController.getTransactionsByPortfolio(req as any, res as any, next);

      verifyResponse(res, 200, mockPaginatedTransactions);
      sinon.assert.calledWith(
        transactionService.getTransactionsByPortfolio as sinon.SinonStub,
        'portfolio1',
        {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          type: 'BUY',
          sort: 'date',
          order: 'desc',
          page: 1,
          limit: 10
        }
      );
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({
        params: { portfolioId: 'nonexistent' },
        query: {},
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(null);

      await transactionController.getTransactionsByPortfolio(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({
        params: { portfolioId: 'portfolio1' },
        query: {},
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        ...mockPortfolio,
        userId: 'other-user'
      });

      await transactionController.getTransactionsByPortfolio(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { portfolioId: 'portfolio1' },
        query: {},
        user: { id: 'user1' }
      });

      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(mockPortfolio);
      const error = new Error('Database error');
      (transactionService.getTransactionsByPortfolio as sinon.SinonStub).rejects(error);

      await transactionController.getTransactionsByPortfolio(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
