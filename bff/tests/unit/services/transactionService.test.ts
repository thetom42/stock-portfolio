import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import { Decimal } from '@prisma/client/runtime/library';
import * as transactionService from '../../../src/services/transactionService';
import { 
  Transaction, 
  CreateTransactionDTO, 
  TransactionQueryParams, 
  PaginatedTransactions 
} from '../../../src/models/Transaction';
import { 
  mockTransactionRepo, 
  mockHoldingRepo, 
  mockPortfolioRepo, 
  setupRepositoryMocks, 
  resetRepositoryMocks 
} from '../../helpers/mockRepositories';

use(spies);

describe('TransactionService', () => {
  const userId = 'user123';
  const holdingId = 'holding123';
  const portfolioId = 'portfolio123';

  beforeEach(() => {
    setupRepositoryMocks();
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  describe('createTransaction', () => {
    const mockCreateData: CreateTransactionDTO = {
      BUY: true,
      AMOUNT: 100,
      PRICE: 150.50,
      COMMISSION: 7.99,
      BROKER: 'TEST_BROKER'
    };

    const mockHolding = {
      HOLDINGS_ID: holdingId,
      PORTFOLIOS_ID: portfolioId,
      QUANTITY: 100,
      ISIN: 'US0378331005'
    };

    const mockDBTransaction = {
      TRANSACTIONS_ID: 'trans123',
      HOLDINGS_ID: holdingId,
      BUY: mockCreateData.BUY,
      TRANSACTION_TIME: new Date(),
      AMOUNT: mockCreateData.AMOUNT,
      PRICE: new Decimal(mockCreateData.PRICE),
      COMMISSION: new Decimal(mockCreateData.COMMISSION || 0),
      BROKER: mockCreateData.BROKER || 'SYSTEM'
    };

    const mockBFFTransaction: Transaction = {
      TRANSACTIONS_ID: mockDBTransaction.TRANSACTIONS_ID,
      HOLDINGS_ID: mockDBTransaction.HOLDINGS_ID,
      BUY: mockDBTransaction.BUY,
      TRANSACTION_TIME: mockDBTransaction.TRANSACTION_TIME,
      AMOUNT: mockDBTransaction.AMOUNT,
      PRICE: Number(mockDBTransaction.PRICE),
      COMMISSION: Number(mockDBTransaction.COMMISSION),
      BROKER: mockDBTransaction.BROKER
    };

    it('should create a buy transaction successfully', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.create.resolves(mockDBTransaction);
      mockHoldingRepo.update.resolves({ ...mockHolding, QUANTITY: 200 });

      const result = await transactionService.createTransaction(userId, holdingId, mockCreateData);

      expect(result).to.deep.equal(mockBFFTransaction);
      expect(mockHoldingRepo.update).to.have.been.called.with(
        holdingId,
        { QUANTITY: mockHolding.QUANTITY + mockCreateData.AMOUNT }
      );
    });

    it('should create a sell transaction successfully', async () => {
      const sellData = { ...mockCreateData, BUY: false, AMOUNT: 50 };
      const sellDBTransaction = { 
        ...mockDBTransaction, 
        BUY: false, 
        AMOUNT: 50 
      };
      const sellBFFTransaction: Transaction = {
        ...mockBFFTransaction,
        BUY: false,
        AMOUNT: 50
      };

      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.create.resolves(sellDBTransaction);
      mockHoldingRepo.update.resolves({ ...mockHolding, QUANTITY: 50 });

      const result = await transactionService.createTransaction(userId, holdingId, sellData);

      expect(result).to.deep.equal(sellBFFTransaction);
      expect(mockHoldingRepo.update).to.have.been.called.with(
        holdingId,
        { QUANTITY: mockHolding.QUANTITY - sellData.AMOUNT }
      );
    });

    it('should throw error if selling more than owned', async () => {
      const sellData = { ...mockCreateData, BUY: false, AMOUNT: 150 };

      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });

      try {
        await transactionService.createTransaction(userId, holdingId, sellData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Insufficient holding quantity for sell transaction');
      }

      expect(mockTransactionRepo.create).to.not.have.been.called();
      expect(mockHoldingRepo.update).to.not.have.been.called();
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      try {
        await transactionService.createTransaction(userId, holdingId, mockCreateData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Holding not found');
      }
    });

    it('should throw error if user not authorized', async () => {
      mockHoldingRepo.findById.resolves(mockHolding);
      mockPortfolioRepo.findById.resolves({ USERS_ID: 'different-user' });

      try {
        await transactionService.createTransaction(userId, holdingId, mockCreateData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Unauthorized');
      }
    });
  });

  describe('getTransactionById', () => {
    const transactionId = 'trans123';
    const mockDBTransaction = {
      TRANSACTIONS_ID: transactionId,
      HOLDINGS_ID: holdingId,
      BUY: true,
      TRANSACTION_TIME: new Date(),
      AMOUNT: 100,
      PRICE: new Decimal('150.50'),
      COMMISSION: new Decimal('7.99'),
      BROKER: 'TEST_BROKER'
    };

    const mockBFFTransaction: Transaction = {
      TRANSACTIONS_ID: mockDBTransaction.TRANSACTIONS_ID,
      HOLDINGS_ID: mockDBTransaction.HOLDINGS_ID,
      BUY: mockDBTransaction.BUY,
      TRANSACTION_TIME: mockDBTransaction.TRANSACTION_TIME,
      AMOUNT: mockDBTransaction.AMOUNT,
      PRICE: Number(mockDBTransaction.PRICE),
      COMMISSION: Number(mockDBTransaction.COMMISSION),
      BROKER: mockDBTransaction.BROKER
    };

    it('should return transaction if authorized', async () => {
      mockTransactionRepo.findById.resolves(mockDBTransaction);
      mockHoldingRepo.findById.resolves({ PORTFOLIOS_ID: portfolioId });
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });

      const result = await transactionService.getTransactionById(userId, transactionId);

      expect(result).to.deep.equal(mockBFFTransaction);
    });

    it('should throw error if transaction not found', async () => {
      mockTransactionRepo.findById.resolves(null);

      try {
        await transactionService.getTransactionById(userId, transactionId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Transaction not found');
      }
    });

    it('should throw error if holding not found', async () => {
      mockTransactionRepo.findById.resolves(mockDBTransaction);
      mockHoldingRepo.findById.resolves(null);

      try {
        await transactionService.getTransactionById(userId, transactionId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Holding not found');
      }
    });

    it('should throw error if user not authorized', async () => {
      mockTransactionRepo.findById.resolves(mockDBTransaction);
      mockHoldingRepo.findById.resolves({ PORTFOLIOS_ID: portfolioId });
      mockPortfolioRepo.findById.resolves({ USERS_ID: 'different-user' });

      try {
        await transactionService.getTransactionById(userId, transactionId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Unauthorized');
      }
    });
  });

  describe('getTransactionsByHolding', () => {
    const mockDBTransactions = [
      {
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: holdingId,
        BUY: true,
        TRANSACTION_TIME: new Date('2023-01-01'),
        AMOUNT: 100,
        PRICE: new Decimal('150.50'),
        COMMISSION: new Decimal('7.99'),
        BROKER: 'TEST_BROKER'
      },
      {
        TRANSACTIONS_ID: 'trans2',
        HOLDINGS_ID: holdingId,
        BUY: false,
        TRANSACTION_TIME: new Date('2023-06-01'),
        AMOUNT: 50,
        PRICE: new Decimal('200.00'),
        COMMISSION: new Decimal('7.99'),
        BROKER: 'TEST_BROKER'
      }
    ];

    const mockBFFTransactions: Transaction[] = mockDBTransactions.map(t => ({
      TRANSACTIONS_ID: t.TRANSACTIONS_ID,
      HOLDINGS_ID: t.HOLDINGS_ID,
      BUY: t.BUY,
      TRANSACTION_TIME: t.TRANSACTION_TIME,
      AMOUNT: t.AMOUNT,
      PRICE: Number(t.PRICE),
      COMMISSION: Number(t.COMMISSION),
      BROKER: t.BROKER
    }));

    it('should return transactions with default params', async () => {
      mockHoldingRepo.findById.resolves({ PORTFOLIOS_ID: portfolioId });
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.findByHolding.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByHolding(userId, holdingId);

      expect(result.transactions).to.deep.equal(mockBFFTransactions);
      expect(result.total).to.equal(2);
      expect(result.page).to.equal(1);
      expect(result.limit).to.equal(10);
      expect(result.totalPages).to.equal(1);
    });

    it('should handle filtering by date range', async () => {
      const queryParams: TransactionQueryParams = {
        startDate: '2023-01-01',
        endDate: '2023-03-01'
      };

      mockHoldingRepo.findById.resolves({ PORTFOLIOS_ID: portfolioId });
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.findByHolding.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByHolding(userId, holdingId, queryParams);

      expect(result.transactions).to.have.lengthOf(1);
      expect(result.transactions[0].TRANSACTIONS_ID).to.equal('trans1');
    });

    it('should handle filtering by transaction type', async () => {
      const queryParams: TransactionQueryParams = {
        type: 'SELL'
      };

      mockHoldingRepo.findById.resolves({ PORTFOLIOS_ID: portfolioId });
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.findByHolding.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByHolding(userId, holdingId, queryParams);

      expect(result.transactions).to.have.lengthOf(1);
      expect(result.transactions[0].BUY).to.be.false;
    });

    it('should handle sorting', async () => {
      const queryParams: TransactionQueryParams = {
        sort: 'price',
        order: 'desc'
      };

      mockHoldingRepo.findById.resolves({ PORTFOLIOS_ID: portfolioId });
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.findByHolding.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByHolding(userId, holdingId, queryParams);

      expect(result.transactions[0].PRICE).to.be.greaterThan(result.transactions[1].PRICE);
    });

    it('should handle pagination', async () => {
      const queryParams: TransactionQueryParams = {
        page: 1,
        limit: 1
      };

      mockHoldingRepo.findById.resolves({ PORTFOLIOS_ID: portfolioId });
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockTransactionRepo.findByHolding.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByHolding(userId, holdingId, queryParams);

      expect(result.transactions).to.have.lengthOf(1);
      expect(result.total).to.equal(2);
      expect(result.page).to.equal(1);
      expect(result.limit).to.equal(1);
      expect(result.totalPages).to.equal(2);
    });
  });

  describe('getTransactionsByPortfolio', () => {
    const mockHoldings = [
      { HOLDINGS_ID: 'holding1', PORTFOLIOS_ID: portfolioId },
      { HOLDINGS_ID: 'holding2', PORTFOLIOS_ID: portfolioId }
    ];

    const mockDBTransactions = [
      {
        TRANSACTIONS_ID: 'trans1',
        HOLDINGS_ID: 'holding1',
        BUY: true,
        TRANSACTION_TIME: new Date('2023-01-01'),
        AMOUNT: 100,
        PRICE: new Decimal('150.50'),
        COMMISSION: new Decimal('7.99'),
        BROKER: 'TEST_BROKER'
      },
      {
        TRANSACTIONS_ID: 'trans2',
        HOLDINGS_ID: 'holding2',
        BUY: false,
        TRANSACTION_TIME: new Date('2023-06-01'),
        AMOUNT: 50,
        PRICE: new Decimal('200.00'),
        COMMISSION: new Decimal('7.99'),
        BROKER: 'TEST_BROKER'
      }
    ];

    const mockBFFTransactions: Transaction[] = mockDBTransactions.map(t => ({
      TRANSACTIONS_ID: t.TRANSACTIONS_ID,
      HOLDINGS_ID: t.HOLDINGS_ID,
      BUY: t.BUY,
      TRANSACTION_TIME: t.TRANSACTION_TIME,
      AMOUNT: t.AMOUNT,
      PRICE: Number(t.PRICE),
      COMMISSION: Number(t.COMMISSION),
      BROKER: t.BROKER
    }));

    it('should return transactions for all holdings', async () => {
      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockHoldingRepo.findByPortfolio.resolves(mockHoldings);
      mockTransactionRepo.findByHolding.resolves([mockDBTransactions[0]]);

      const result = await transactionService.getTransactionsByPortfolio(userId, portfolioId);

      expect(result.transactions).to.have.lengthOf(2);
      expect(mockTransactionRepo.findByHolding).to.have.been.called.with('holding1');
      expect(mockTransactionRepo.findByHolding).to.have.been.called.with('holding2');
    });

    it('should handle filtering and sorting', async () => {
      const queryParams: TransactionQueryParams = {
        type: 'BUY',
        sort: 'date',
        order: 'asc'
      };

      mockPortfolioRepo.findById.resolves({ USERS_ID: userId });
      mockHoldingRepo.findByPortfolio.resolves(mockHoldings);
      mockTransactionRepo.findByHolding.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByPortfolio(userId, portfolioId, queryParams);

      expect(result.transactions).to.have.lengthOf(1);
      expect(result.transactions[0].BUY).to.be.true;
    });

    it('should throw error if user not authorized', async () => {
      mockPortfolioRepo.findById.resolves({ USERS_ID: 'different-user' });

      try {
        await transactionService.getTransactionsByPortfolio(userId, portfolioId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Unauthorized');
      }

      expect(mockHoldingRepo.findByPortfolio).to.not.have.been.called();
    });
  });
});
