import { expect } from 'chai';
import sinon from 'sinon';
import { holdingService } from '../../../src/services/holdingService';
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
      req = createMockRequest({ body: mockCreateData });
      const startDate = new Date();
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

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ body: mockCreateData });
      const error = new Error('Failed to create holding');
      (holdingService.createHolding as sinon.SinonStub).rejects(error);

      await holdingController.createHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getHolding', () => {
    it('should return holding if found', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const startDate = new Date();
      (holdingService.getHoldingById as sinon.SinonStub).resolves({
        id: '1',
        portfolioId: '1',
        isin: 'US0378331005',
        quantity: 10,
        startDate,
        endDate: null
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
      req = createMockRequest({ params: { id: '999' } });
      (holdingService.getHoldingById as sinon.SinonStub).resolves(null);

      await holdingController.getHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' } });
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
        body: mockUpdateData
      });
      const startDate = new Date();
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
        body: mockUpdateData
      });
      (holdingService.updateHolding as sinon.SinonStub).resolves(null);

      await holdingController.updateHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData
      });
      const error = new Error('Failed to update holding');
      (holdingService.updateHolding as sinon.SinonStub).rejects(error);

      await holdingController.updateHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteHolding', () => {
    it('should close holding successfully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const startDate = new Date();
      const endDate = new Date();
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
      req = createMockRequest({ params: { id: '999' } });
      (holdingService.closeHolding as sinon.SinonStub).rejects(new Error('Holding not found'));

      await holdingController.deleteHolding(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const error = new Error('Failed to close holding');
      (holdingService.closeHolding as sinon.SinonStub).rejects(error);

      await holdingController.deleteHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getHoldingPerformance', () => {
    it('should return performance metrics', async () => {
      req = createMockRequest({ params: { id: '1' } });
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
      req = createMockRequest({ params: { id: '999' } });
      (holdingService.getHoldingPerformance as sinon.SinonStub).rejects(new Error('Holding not found'));

      await holdingController.getHoldingPerformance(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });
  });

  describe('getHoldingTransactions', () => {
    it('should return transactions', async () => {
      req = createMockRequest({ params: { id: '1' } });
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
      req = createMockRequest({ params: { id: '999' } });
      (holdingService.getHoldingTransactions as sinon.SinonStub).rejects(new Error('Holding not found'));

      await holdingController.getHoldingTransactions(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });
  });

  describe('getHoldingValue', () => {
    it('should return value metrics', async () => {
      req = createMockRequest({ params: { id: '1' } });
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
      req = createMockRequest({ params: { id: '999' } });
      (holdingService.getHoldingValue as sinon.SinonStub).rejects(new Error('Holding not found'));

      await holdingController.getHoldingValue(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });
  });

  describe('getHoldingHistory', () => {
    it('should return historical data', async () => {
      req = createMockRequest({ params: { id: '1' } });
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
      req = createMockRequest({ params: { id: '999' } });
      (holdingService.getHoldingHistory as sinon.SinonStub).rejects(new Error('Holding not found'));

      await holdingController.getHoldingHistory(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Holding not found' });
    });
  });
});
