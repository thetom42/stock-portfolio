import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { transactionService, setTransactionRepository, setHoldingRepository } from '../../../src/services/transactionService';
import { Transaction, CreateTransactionDTO, TransactionQueryParams } from '../../../src/models/Transaction';
import { createDecimal, resetAllMocks } from '../../helpers/mockRepositories';

describe('TransactionService', () => {
  const holdingId = 'holding123';
  const portfolioId = 'portfolio123';
  let mockTransactionRepo: any;
  let mockHoldingRepo: any;

  beforeEach(() => {
    // Create mock repositories
    mockTransactionRepo = {
      create: sinon.stub(),
      findById: sinon.stub(),
      findByHoldingId: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub()
    };

    mockHoldingRepo = {
      findById: sinon.stub(),
      findByPortfolioId: sinon.stub(),
      update: sinon.stub()
    };

    // Inject mock repositories into the singleton instance
    setTransactionRepository(mockTransactionRepo);
    setHoldingRepository(mockHoldingRepo);
  });

  afterEach(() => {
    resetAllMocks();
    sinon.restore();
  });

  describe('createTransaction', () => {
    const mockCreateData: CreateTransactionDTO = {
      buy: true,
      amount: 100,
      price: 150.50,
      commission: 7.99,
      broker: 'TEST_BROKER'
    };

    // DB layer mock uses old naming
    const mockDBHolding = {
      holding_id: holdingId,
      portfolio_id: portfolioId,
      quantity: 100,
      isin: 'US0378331005'
    };

    const mockDBTransaction = {
      transaction_id: 'trans123',
      holding_id: holdingId,
      buy: mockCreateData.buy,
      transaction_time: new Date(),
      amount: mockCreateData.amount,
      price: createDecimal(mockCreateData.price),
      commission: createDecimal(mockCreateData.commission || 0),
      broker: mockCreateData.broker || 'SYSTEM'
    };

    // BFF layer response uses new naming
    const expectedBFFTransaction: Transaction = {
      id: mockDBTransaction.transaction_id,
      holdingId: mockDBTransaction.holding_id,
      buy: mockDBTransaction.buy,
      transactionTime: mockDBTransaction.transaction_time,
      amount: mockDBTransaction.amount,
      price: Number(mockDBTransaction.price),
      commission: Number(mockDBTransaction.commission),
      broker: mockDBTransaction.broker
    };

    it('should create a buy transaction successfully', async () => {
      mockHoldingRepo.findById.resolves(mockDBHolding);
      mockTransactionRepo.create.resolves(mockDBTransaction);
      mockHoldingRepo.update.resolves({ ...mockDBHolding, quantity: 200 });

      const result = await transactionService.createTransaction(holdingId, mockCreateData);

      expect(result).to.deep.equal(expectedBFFTransaction);
      sinon.assert.calledWith(mockHoldingRepo.update, holdingId, { quantity: mockDBHolding.quantity + mockCreateData.amount });
    });

    it('should create a sell transaction successfully', async () => {
      const sellData = { ...mockCreateData, buy: false, amount: 50 };
      const sellDBTransaction = {
        ...mockDBTransaction,
        buy: false,
        amount: 50
      };
      const sellBFFTransaction: Transaction = {
        ...expectedBFFTransaction,
        buy: false,
        amount: 50
      };

      mockHoldingRepo.findById.resolves(mockDBHolding);
      mockTransactionRepo.create.resolves(sellDBTransaction);
      mockHoldingRepo.update.resolves({ ...mockDBHolding, quantity: 50 });

      const result = await transactionService.createTransaction(holdingId, sellData);

      expect(result).to.deep.equal(sellBFFTransaction);
      sinon.assert.calledWith(mockHoldingRepo.update, holdingId, { quantity: mockDBHolding.quantity - sellData.amount });
    });

    it('should throw error if selling more than owned', async () => {
      const sellData = { ...mockCreateData, buy: false, amount: 150 };

      mockHoldingRepo.findById.resolves(mockDBHolding);

      await expect(transactionService.createTransaction(holdingId, sellData))
        .to.be.rejectedWith('Insufficient holding quantity for sell transaction');

      sinon.assert.notCalled(mockTransactionRepo.create);
      sinon.assert.notCalled(mockHoldingRepo.update);
    });

    it('should throw error if holding not found', async () => {
      mockHoldingRepo.findById.resolves(null);

      await expect(transactionService.createTransaction(holdingId, mockCreateData))
        .to.be.rejectedWith('Holding not found');
    });
  });

  describe('getTransactionById', () => {
    const transactionId = 'trans123';

    // DB layer mock uses old naming
    const mockDBTransaction = {
      transaction_id: transactionId,
      holding_id: holdingId,
      buy: true,
      transaction_time: new Date(),
      amount: 100,
      price: createDecimal(150.50),
      commission: createDecimal(7.99),
      broker: 'TEST_BROKER'
    };

    // BFF layer response uses new naming
    const expectedBFFTransaction: Transaction = {
      id: mockDBTransaction.transaction_id,
      holdingId: mockDBTransaction.holding_id,
      buy: mockDBTransaction.buy,
      transactionTime: mockDBTransaction.transaction_time,
      amount: mockDBTransaction.amount,
      price: Number(mockDBTransaction.price),
      commission: Number(mockDBTransaction.commission),
      broker: mockDBTransaction.broker
    };

    it('should return transaction if found', async () => {
      mockTransactionRepo.findById.resolves(mockDBTransaction);

      const result = await transactionService.getTransactionById(transactionId);

      expect(result).to.deep.equal(expectedBFFTransaction);
    });

    it('should return null if transaction not found', async () => {
      mockTransactionRepo.findById.resolves(null);

      const result = await transactionService.getTransactionById(transactionId);

      expect(result).to.be.null;
    });
  });

  describe('getTransactionsByHolding', () => {
    // DB layer mock uses old naming
    const mockDBTransactions = [
      {
        transaction_id: 'trans1',
        holding_id: holdingId,
        buy: true,
        transaction_time: new Date('2023-01-01'),
        amount: 100,
        price: createDecimal(150.50),
        commission: createDecimal(7.99),
        broker: 'TEST_BROKER'
      },
      {
        transaction_id: 'trans2',
        holding_id: holdingId,
        buy: false,
        transaction_time: new Date('2023-06-01'),
        amount: 50,
        price: createDecimal(200.00),
        commission: createDecimal(7.99),
        broker: 'TEST_BROKER'
      }
    ];

    // BFF layer response uses new naming
    const expectedBFFTransactions: Transaction[] = mockDBTransactions.map(t => ({
      id: t.transaction_id,
      holdingId: t.holding_id,
      buy: t.buy,
      transactionTime: t.transaction_time,
      amount: t.amount,
      price: Number(t.price),
      commission: Number(t.commission),
      broker: t.broker
    }));

    it('should return transactions with default params', async () => {
      mockTransactionRepo.findByHoldingId.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByHolding(holdingId);

      expect(result.transactions).to.deep.equal(expectedBFFTransactions);
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

      mockTransactionRepo.findByHoldingId.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByHolding(holdingId, queryParams);

      expect(result.transactions).to.have.lengthOf(1);
      expect(result.transactions[0].id).to.equal('trans1');
    });

    it('should handle filtering by transaction type', async () => {
      const queryParams: TransactionQueryParams = {
        type: 'SELL'
      };

      mockTransactionRepo.findByHoldingId.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByHolding(holdingId, queryParams);

      expect(result.transactions).to.have.lengthOf(1);
      expect(result.transactions[0].buy).to.be.false;
    });

    it('should handle sorting', async () => {
      const queryParams: TransactionQueryParams = {
        sort: 'price',
        order: 'desc'
      };

      mockTransactionRepo.findByHoldingId.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByHolding(holdingId, queryParams);

      expect(result.transactions[0].price).to.be.greaterThan(result.transactions[1].price);
    });

    it('should handle pagination', async () => {
      const queryParams: TransactionQueryParams = {
        page: 1,
        limit: 1
      };

      mockTransactionRepo.findByHoldingId.resolves(mockDBTransactions);

      const result = await transactionService.getTransactionsByHolding(holdingId, queryParams);

      expect(result.transactions).to.have.lengthOf(1);
      expect(result.total).to.equal(2);
      expect(result.page).to.equal(1);
      expect(result.limit).to.equal(1);
      expect(result.totalPages).to.equal(2);
    });
  });

  describe('getTransactionsByPortfolio', () => {
    // DB layer mock uses old naming
    const mockDBHoldings = [
      { holding_id: 'holding1', portfolio_id: portfolioId },
      { holding_id: 'holding2', portfolio_id: portfolioId }
    ];

    const mockDBTransactions = [
      {
        transaction_id: 'trans1',
        holding_id: 'holding1',
        buy: true,
        transaction_time: new Date('2023-01-01'),
        amount: 100,
        price: createDecimal(150.50),
        commission: createDecimal(7.99),
        broker: 'TEST_BROKER'
      },
      {
        transaction_id: 'trans2',
        holding_id: 'holding2',
        buy: false,
        transaction_time: new Date('2023-06-01'),
        amount: 50,
        price: createDecimal(200.00),
        commission: createDecimal(7.99),
        broker: 'TEST_BROKER'
      }
    ];

    // BFF layer response uses new naming
    const expectedBFFTransactions: Transaction[] = mockDBTransactions.map(t => ({
      id: t.transaction_id,
      holdingId: t.holding_id,
      buy: t.buy,
      transactionTime: t.transaction_time,
      amount: t.amount,
      price: Number(t.price),
      commission: Number(t.commission),
      broker: t.broker
    }));

    it('should return transactions for all holdings', async () => {
      mockHoldingRepo.findByPortfolioId.resolves(mockDBHoldings);
      mockTransactionRepo.findByHoldingId.onFirstCall().resolves([mockDBTransactions[0]]);
      mockTransactionRepo.findByHoldingId.onSecondCall().resolves([mockDBTransactions[1]]);

      const result = await transactionService.getTransactionsByPortfolio(portfolioId);

      expect(result.transactions).to.deep.equal(expectedBFFTransactions);
      sinon.assert.calledWith(mockTransactionRepo.findByHoldingId, 'holding1');
      sinon.assert.calledWith(mockTransactionRepo.findByHoldingId, 'holding2');
    });

    it('should handle filtering and sorting', async () => {
      const queryParams: TransactionQueryParams = {
        type: 'BUY',
        sort: 'date',
        order: 'asc'
      };

      mockHoldingRepo.findByPortfolioId.resolves(mockDBHoldings);
      mockTransactionRepo.findByHoldingId.onFirstCall().resolves([mockDBTransactions[0]]);
      mockTransactionRepo.findByHoldingId.onSecondCall().resolves([mockDBTransactions[1]]);

      const result = await transactionService.getTransactionsByPortfolio(portfolioId, queryParams);

      expect(result.transactions).to.have.lengthOf(1);
      expect(result.transactions[0].buy).to.be.true;
    });

    it('should return empty transactions for portfolio with no holdings', async () => {
      mockHoldingRepo.findByPortfolioId.resolves([]);

      const result = await transactionService.getTransactionsByPortfolio(portfolioId);

      expect(result.transactions).to.have.lengthOf(0);
      expect(result.total).to.equal(0);
    });
  });

  describe('ID Generation', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('should generate valid UUIDs for transactions', async () => {
      const mockDBTransaction = {
        transaction_id: '1',
        holding_id: holdingId,
        buy: true,
        transaction_time: new Date(),
        amount: 100,
        price: createDecimal(150.50),
        commission: createDecimal(7.99),
        broker: 'TEST_BROKER'
      };

      mockHoldingRepo.findById.resolves({ holding_id: holdingId, portfolio_id: portfolioId, quantity: 100 });
      mockTransactionRepo.create.resolves(mockDBTransaction);

      await transactionService.createTransaction(holdingId, {
        buy: true,
        amount: 100,
        price: 150.50,
        commission: 7.99,
        broker: 'TEST_BROKER'
      });

      // Verify the ID format in the database record
      const createArgs = mockTransactionRepo.create.firstCall.args[0];
      expect(createArgs.transaction_id).to.match(uuidRegex);
    });

    it('should generate unique transaction IDs', async () => {
      const ids = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const mockDBTransaction = {
          transaction_id: `mock-${i}`,
          holding_id: holdingId,
          buy: true,
          transaction_time: new Date(),
          amount: 100,
          price: createDecimal(150.50),
          commission: createDecimal(7.99),
          broker: 'TEST_BROKER'
        };

        mockHoldingRepo.findById.resolves({ holding_id: holdingId, portfolio_id: portfolioId, quantity: 100 });
        mockTransactionRepo.create.resolves(mockDBTransaction);

        await transactionService.createTransaction(holdingId, {
          buy: true,
          amount: 100,
          price: 150.50,
          commission: 7.99,
          broker: 'TEST_BROKER'
        });
        const createArgs = mockTransactionRepo.create.getCall(i).args[0];
        ids.add(createArgs.transaction_id);
      }

      expect(ids.size).to.equal(iterations);
    });

    it('should handle ID generation errors', async () => {
      mockHoldingRepo.findById.resolves({ holding_id: holdingId, portfolio_id: portfolioId, quantity: 100 });
      mockTransactionRepo.create.rejects(new Error('ID generation failed'));

      await expect(transactionService.createTransaction(holdingId, {
        buy: true,
        amount: 100,
        price: 150.50,
        commission: 7.99,
        broker: 'TEST_BROKER'
      })).to.be.rejectedWith('ID generation failed');
    });
  });
});
