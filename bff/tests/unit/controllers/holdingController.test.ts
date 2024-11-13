import { expect } from 'chai';
import sinon from 'sinon';
import * as holdingService from '../../../src/services/holdingService';
import * as holdingController from '../../../src/controllers/holdingController';
import { CreateHoldingDTO, HoldingDetails, UpdateHoldingDTO } from '../../../src/models/Holding';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
import { setupRepositoryMocks, resetRepositoryMocks, mockHoldingRepo } from '../../helpers/mockRepositories';
import { Decimal } from '@prisma/client/runtime/library';

describe('HoldingController', () => {
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

  const mockHoldingDetails: HoldingDetails = {
    HOLDINGS_ID: '1',
    PORTFOLIOS_ID: '1',
    ISIN: 'US0378331005',
    QUANTITY: 10,
    START_DATE: new Date(),
    END_DATE: null,
    stock: {
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currency: 'USD'
    },
    currentPrice: 150.50,
    totalValue: 1505.00,
    gainLoss: -9.99,
    gainLossPercentage: -0.66
  };

  describe('createHolding', () => {
    const mockCreateData: CreateHoldingDTO = {
      PORTFOLIOS_ID: '1',
      ISIN: 'US0378331005',
      QUANTITY: 10,
      PRICE: 150.50
    };

    it('should create a holding and return 201 status', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      sinon.stub(holdingService, 'createHolding').resolves(mockHoldingDetails);

      await holdingController.createHolding(req as any, res as any, next);

      verifyResponse(res, 201, { holding: mockHoldingDetails });
    });

    it('should return 403 if user is not authorized', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user2' }
      });

      const error = new Error('Unauthorized');
      sinon.stub(holdingService, 'createHolding').rejects(error);

      await holdingController.createHolding(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Unauthorized' });
    });

    it('should call next with error for other errors', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      const error = new Error('Database error');
      sinon.stub(holdingService, 'createHolding').rejects(error);

      await holdingController.createHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getHolding', () => {
    it('should return holding when found', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(holdingService, 'getHoldingById').resolves(mockHoldingDetails);

      await holdingController.getHolding(req as any, res as any, next);

      verifyResponse(res, 200, { holding: mockHoldingDetails });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { id: 'nonexistent' },
        user: { id: 'user1' }
      });

      sinon.stub(holdingService, 'getHoldingById').resolves(null);

      await holdingController.getHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should call next with error for other errors', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      const error = new Error('Database error');
      sinon.stub(holdingService, 'getHoldingById').rejects(error);

      await holdingController.getHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('updateHolding', () => {
    const mockUpdateData: UpdateHoldingDTO = {
      QUANTITY: 15
    };

    const updatedMockHolding: HoldingDetails = {
      ...mockHoldingDetails,
      QUANTITY: 15,
      totalValue: 2257.50 // 15 * 150.50
    };

    it('should update holding and return updated data', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });

      sinon.stub(holdingService, 'updateHolding').resolves(updatedMockHolding);

      await holdingController.updateHolding(req as any, res as any, next);

      verifyResponse(res, 200, { holding: updatedMockHolding });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { id: 'nonexistent' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });

      const error = new Error('Holding not found');
      sinon.stub(holdingService, 'updateHolding').rejects(error);

      await holdingController.updateHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should call next with error for other errors', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });

      const error = new Error('Database error');
      sinon.stub(holdingService, 'updateHolding').rejects(error);

      await holdingController.updateHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteHolding', () => {
    it('should delete holding and return 204 status', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(holdingService, 'closeHolding').resolves();

      await holdingController.deleteHolding(req as any, res as any, next);

      expect(res.status.calledWith(204)).to.be.true;
      expect(res.send.calledOnce).to.be.true;
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { id: 'nonexistent' },
        user: { id: 'user1' }
      });

      const error = new Error('Holding not found');
      sinon.stub(holdingService, 'closeHolding').rejects(error);

      await holdingController.deleteHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should call next with error for other errors', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      const error = new Error('Database error');
      sinon.stub(holdingService, 'closeHolding').rejects(error);

      await holdingController.deleteHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getHoldingPerformance', () => {
    const mockPerformanceData = {
      totalReturn: 500.50,
      percentageReturn: 15.5,
      annualizedReturn: 12.3,
      holdingPeriod: 365 // days
    };

    it('should return holding performance data', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(holdingService, 'getHoldingPerformance').resolves(mockPerformanceData);

      await holdingController.getHoldingPerformance(req as any, res as any, next);

      verifyResponse(res, 200, { performance: mockPerformanceData });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { id: 'nonexistent' },
        user: { id: 'user1' }
      });

      const error = new Error('Holding not found');
      sinon.stub(holdingService, 'getHoldingPerformance').rejects(error);

      await holdingController.getHoldingPerformance(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });
  });

  describe('getHoldingTransactions', () => {
    const mockTransactions = [{
      TRANSACTIONS_ID: '1',
      HOLDINGS_ID: '1',
      BUY: true,
      AMOUNT: 10,
      PRICE: new Decimal(150.50),
      TRANSACTION_TIME: new Date(),
      COMMISSION: new Decimal(5.00),
      BROKER: 'Example Broker'
    }];

    it('should return holding transactions', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(holdingService, 'getHoldingTransactions').resolves(mockTransactions);

      await holdingController.getHoldingTransactions(req as any, res as any, next);

      verifyResponse(res, 200, { transactions: mockTransactions });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { id: 'nonexistent' },
        user: { id: 'user1' }
      });

      const error = new Error('Holding not found');
      sinon.stub(holdingService, 'getHoldingTransactions').rejects(error);

      await holdingController.getHoldingTransactions(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });
  });

  describe('getHoldingValue', () => {
    const mockValueData = {
      currentValue: 1550.50,
      costBasis: 1505.00,
      unrealizedGainLoss: 45.50,
      unrealizedGainLossPercentage: 3.02
    };

    it('should return holding value data', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(holdingService, 'getHoldingValue').resolves(mockValueData);

      await holdingController.getHoldingValue(req as any, res as any, next);

      verifyResponse(res, 200, { value: mockValueData });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { id: 'nonexistent' },
        user: { id: 'user1' }
      });

      const error = new Error('Holding not found');
      sinon.stub(holdingService, 'getHoldingValue').rejects(error);

      await holdingController.getHoldingValue(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });
  });

  describe('getHoldingHistory', () => {
    const mockHistoryData = [
      {
        date: new Date('2023-01-01'),
        price: 150.50,
        value: 1505.00
      },
      {
        date: new Date('2023-01-02'),
        price: 155.05,
        value: 1550.50
      }
    ];

    it('should return holding history data', async () => {
      req = createMockRequest({
        params: { id: '1' },
        user: { id: 'user1' }
      });

      sinon.stub(holdingService, 'getHoldingHistory').resolves(mockHistoryData);

      await holdingController.getHoldingHistory(req as any, res as any, next);

      verifyResponse(res, 200, { history: mockHistoryData });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { id: 'nonexistent' },
        user: { id: 'user1' }
      });

      const error = new Error('Holding not found');
      sinon.stub(holdingService, 'getHoldingHistory').rejects(error);

      await holdingController.getHoldingHistory(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });
  });
});
