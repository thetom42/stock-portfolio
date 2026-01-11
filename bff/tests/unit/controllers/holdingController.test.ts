import { expect } from 'chai';
import sinon from 'sinon';
import { holdingService } from '../../../src/services/holdingService';
import { portfolioService } from '../../../src/services/portfolioService';
import * as holdingController from '../../../src/controllers/holdingController';
import { CreateHoldingDTO, UpdateHoldingDTO } from '../../../src/models/Holding';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';

describe('HoldingController', () => {
  // Date matcher for response verification
  const dateMatcher = { kind: 'date' };

  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;
  beforeEach(() => {
    res = createMockResponse();
    next = sinon.spy();
    // Stub holdingService methods
    sinon.stub(holdingService, 'createHolding');
    sinon.stub(holdingService, 'getHoldingById');
    sinon.stub(holdingService, 'updateHolding');
    sinon.stub(holdingService, 'closeHolding');
    sinon.stub(holdingService, 'getHoldingPerformance');
    sinon.stub(holdingService, 'getHoldingTransactions');
    sinon.stub(holdingService, 'getHoldingValue');
    sinon.stub(holdingService, 'getHoldingHistory');
    // Stub portfolioService for ownership checks
    sinon.stub(portfolioService, 'getPortfolioById');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createHolding', () => {
    const mockCreateData: CreateHoldingDTO = {
      portfolioId: '1',
      isin: 'US0378331005',
      quantity: 10,
      price: 150.50
    };

    it('should create holding and return 201 status', async () => {
      req = createMockRequest({ body: mockCreateData, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      // Mock portfolio ownership check
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });
      (holdingService.createHolding as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: mockCreateData.portfolioId,
        isin: mockCreateData.isin,
        quantity: mockCreateData.quantity,
        startDate,
        endDate: null
      });

      await holdingController.createHolding(req as any, res as any, next);

      verifyResponse(res, 201, {
        holding: {
          id: '1',
          portfolioId: mockCreateData.portfolioId,
          isin: mockCreateData.isin,
          quantity: mockCreateData.quantity,
          startDate: dateMatcher,
          endDate: null
        }
      });
    });

    it('should return 404 if portfolio not found', async () => {
      req = createMockRequest({ body: mockCreateData, user: { id: 'user1' } });
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves(null);

      await holdingController.createHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Portfolio not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({ body: mockCreateData, user: { id: 'user1' } });
      const createdAt = new Date();
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'other-user',
        name: 'Test Portfolio',
        createdAt
      });

      await holdingController.createHolding(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ body: mockCreateData, user: { id: 'user1' } });
      const createdAt = new Date();
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });
      const error = new Error('Failed to create holding');
      (holdingService.createHolding as sinon.SinonStub).rejects(error);

      await holdingController.createHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getHolding', () => {
    it('should return holding if found', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      // Mock portfolio ownership check
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });

      await holdingController.getHolding(req as any, res as any, next);

      verifyResponse(res, 200, {
        holding: {
          id: '1',
          portfolioId: '1',
          isin: 'US0378331005',
          quantity: 10,
          startDate: dateMatcher,
          endDate: null
        }
      });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({ params: { id: '999' }, user: { id: 'user1' } });
      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await holdingController.getHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'other-user',
        name: 'Test Portfolio',
        createdAt
      });

      await holdingController.getHolding(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const error = new Error('Failed to fetch holding');
      (holdingService.getHoldingById as sinon.SinonStub).rejects(error);

      await holdingController.getHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('updateHolding', () => {
    const mockUpdateData: UpdateHoldingDTO = {
      quantity: 20
    };

    it('should update holding successfully', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });
      const startDate = new Date();
      const createdAt = new Date();
      // Mock getHoldingById for existence and ownership check
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      // Mock portfolio ownership check
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });
      (holdingService.updateHolding as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: mockUpdateData.quantity,
        startDate,
        endDate: null
      });

      await holdingController.updateHolding(req as any, res as any, next);

      verifyResponse(res, 200, {
        holding: {
          id: '1',
          portfolioId: '1',
          isin: 'US0378331005',
          quantity: mockUpdateData.quantity,
          startDate: dateMatcher,
          endDate: null
        }
      });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });
      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await holdingController.updateHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });
      const startDate = new Date();
      const createdAt = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'other-user',
        name: 'Test Portfolio',
        createdAt
      });

      await holdingController.updateHolding(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData,
        user: { id: 'user1' }
      });
      const startDate = new Date();
      const createdAt = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });
      const error = new Error('Failed to update holding');
      (holdingService.updateHolding as sinon.SinonStub).rejects(error);

      await holdingController.updateHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteHolding', () => {
    it('should close holding successfully', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const endDate = new Date();
      const createdAt = new Date();
      // Mock getHoldingById for existence and ownership check
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      // Mock portfolio ownership check
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });
      (holdingService.closeHolding as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate
      });

      await holdingController.deleteHolding(req as any, res as any, next);

      verifyResponse(res, 204);
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({ params: { id: '999' }, user: { id: 'user1' } });
      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await holdingController.deleteHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'other-user',
        name: 'Test Portfolio',
        createdAt
      });

      await holdingController.deleteHolding(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });
      const error = new Error('Failed to close holding');
      (holdingService.closeHolding as sinon.SinonStub).rejects(error);

      await holdingController.deleteHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getHoldingPerformance', () => {
    it('should return performance metrics', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      // Mock getHoldingById for existence and ownership check
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      // Mock portfolio ownership check
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });
      (holdingService.getHoldingPerformance as sinon.SinonStub).resolves({
        totalReturn: 1000,
        percentageReturn: 10,
        annualizedReturn: 12,
        holdingPeriod: 30
      });

      await holdingController.getHoldingPerformance(req as any, res as any, next);

      verifyResponse(res, 200, {
        performance: {
          totalReturn: 1000,
          percentageReturn: 10,
          annualizedReturn: 12,
          holdingPeriod: 30
        }
      });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({ params: { id: '999' }, user: { id: 'user1' } });
      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await holdingController.getHoldingPerformance(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'other-user',
        name: 'Test Portfolio',
        createdAt
      });

      await holdingController.getHoldingPerformance(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });
  });

  describe('getHoldingTransactions', () => {
    it('should return transactions', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      // Mock getHoldingById for existence and ownership check
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      // Mock portfolio ownership check
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });
      (holdingService.getHoldingTransactions as sinon.SinonStub).resolves([
        {
          id: '1',
          holdingId: '1',
          amount: 10,
          price: 150.50,
          buy: true,
          commission: 9.99,
          broker: 'Test Broker',
          transactionTime: new Date()
        }
      ]);

      await holdingController.getHoldingTransactions(req as any, res as any, next);

      verifyResponse(res, 200, {
        transactions: [{
          id: '1',
          holdingId: '1',
          amount: 10,
          price: 150.50,
          buy: true,
          commission: 9.99,
          broker: 'Test Broker',
          transactionTime: dateMatcher
        }]
      });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({ params: { id: '999' }, user: { id: 'user1' } });
      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await holdingController.getHoldingTransactions(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'other-user',
        name: 'Test Portfolio',
        createdAt
      });

      await holdingController.getHoldingTransactions(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });
  });

  describe('getHoldingValue', () => {
    it('should return value metrics', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      // Mock getHoldingById for existence and ownership check
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      // Mock portfolio ownership check
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });
      (holdingService.getHoldingValue as sinon.SinonStub).resolves({
        currentValue: 2000,
        costBasis: 1500,
        unrealizedGainLoss: 500,
        unrealizedGainLossPercentage: 33.33
      });

      await holdingController.getHoldingValue(req as any, res as any, next);

      verifyResponse(res, 200, {
        value: {
          currentValue: 2000,
          costBasis: 1500,
          unrealizedGainLoss: 500,
          unrealizedGainLossPercentage: 33.33
        }
      });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({ params: { id: '999' }, user: { id: 'user1' } });
      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await holdingController.getHoldingValue(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'other-user',
        name: 'Test Portfolio',
        createdAt
      });

      await holdingController.getHoldingValue(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });
  });

  describe('getHoldingHistory', () => {
    it('should return historical data', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      // Mock getHoldingById for existence and ownership check
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      // Mock portfolio ownership check
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'user1',
        name: 'Test Portfolio',
        createdAt
      });
      (holdingService.getHoldingHistory as sinon.SinonStub).resolves([
        {
          date: new Date(),
          value: 2000,
          quantity: 10,
          price: 200
        }
      ]);

      await holdingController.getHoldingHistory(req as any, res as any, next);

      verifyResponse(res, 200, {
        history: [
          {
            date: dateMatcher,
            value: 2000,
            quantity: 10,
            price: 200
          }
        ]
      });
    });

    it('should return 404 if holding not found', async () => {
      req = createMockRequest({ params: { id: '999' }, user: { id: 'user1' } });
      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await holdingController.getHoldingHistory(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should return 403 if user does not own portfolio', async () => {
      req = createMockRequest({ params: { id: '1' }, user: { id: 'user1' } });
      const startDate = new Date();
      const createdAt = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
      });
      (portfolioService.getPortfolioById as sinon.SinonStub).resolves({
        id: '1',
        userId: 'other-user',
        name: 'Test Portfolio',
        createdAt
      });

      await holdingController.getHoldingHistory(req as any, res as any, next);

      verifyResponse(res, 403, { error: 'Forbidden' });
    });
  });
});
