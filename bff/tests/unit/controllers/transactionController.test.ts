import { expect } from 'chai';
import sinon from 'sinon';
import * as transactionService from '../../../src/services/transactionService';
import * as transactionController from '../../../src/controllers/transactionController';
import { Transaction, CreateTransactionDTO, PaginatedTransactions } from '../../../src/models/Transaction';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
import { setupRepositoryMocks, resetRepositoryMocks, mockTransactionRepo } from '../../helpers/mockRepositories';

describe('TransactionController', () => {
  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    setupRepositoryMocks();
    res = createMockResponse();
    next = sinon.spy();
  });

  afterEach(() => {
    resetRepositoryMocks();
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

    const mockCreatedTransaction: Transaction = {
      id: '1',
      holdingId: '1',
      buy: mockCreateData.buy,
      amount: mockCreateData.amount,
      price: mockCreateData.price,
      commission: mockCreateData.commission!,
      broker: mockCreateData.broker!,
      transactionTime: new Date()
    };

    it('should create a buy transaction successfully', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      sinon.stub(transactionService, 'createTransaction').resolves(mockCreatedTransaction);

      await transactionController.createTransaction(req as any, res, next);

      verifyResponse(res, 201, { transaction: mockCreatedTransaction });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      const error = new Error('Holding not found');
      sinon.stub(transactionService, 'createTransaction').rejects(error);

      await transactionController.createTransaction(req as any, res, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user is not authorized', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user2' }
      });

      const error = new Error('Unauthorized');
      sinon.stub(transactionService, 'createTransaction').rejects(error);

      await transactionController.createTransaction(req as any, res, next);

      verifyResponse(res, 403, { error: 'Unauthorized' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      const error = new Error('Database error');
      sinon.stub(transactionService, 'createTransaction').rejects(error);

      await transactionController.createTransaction(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getTransactionsByHolding', () => {
    const mockTransaction: Transaction = {
      id: '1',
      holdingId: '1',
      buy: true,
      amount: 10,
      price: 150.50,
      commission: 9.99,
      broker: 'Test Broker',
      transactionTime: new Date()
    };

    const mockPaginatedTransactions: PaginatedTransactions = {
      transactions: [mockTransaction],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('should return transactions for authorized user', async () => {
      req = createMockRequest({
        params: { holdingId: '1' },
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          page: '1',
          limit: '10'
        },
        user: { id: 'user1' }
      });

      sinon.stub(transactionService, 'getTransactionsByHolding').resolves(mockPaginatedTransactions);

      await transactionController.getTransactionsByHolding(req as any, res, next);

      verifyResponse(res, 200, mockPaginatedTransactions);
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { holdingId: '999' },
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        user: { id: 'user1' }
      });

      const error = new Error('Holding not found');
      sinon.stub(transactionService, 'getTransactionsByHolding').rejects(error);

      await transactionController.getTransactionsByHolding(req as any, res, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user is not authorized', async () => {
      req = createMockRequest({
        params: { holdingId: '1' },
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        user: { id: 'user2' }
      });

      const error = new Error('Unauthorized');
      sinon.stub(transactionService, 'getTransactionsByHolding').rejects(error);

      await transactionController.getTransactionsByHolding(req as any, res, next);

      verifyResponse(res, 403, { error: 'Unauthorized' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { holdingId: '1' },
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31'
        },
        user: { id: 'user1' }
      });

      const error = new Error('Database error');
      sinon.stub(transactionService, 'getTransactionsByHolding').rejects(error);

      await transactionController.getTransactionsByHolding(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
