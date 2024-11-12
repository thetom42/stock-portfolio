import { expect } from 'chai';
import sinon from 'sinon';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express-serve-static-core';
import * as holdingService from '../../../src/services/holdingService';
import * as holdingController from '../../../src/controllers/holdingController';
import { CreateHoldingDTO, HoldingDetails } from '../../../src/models/Holding';

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('HoldingController', () => {
  let req: Partial<ExpressRequest>;
  let res: MockResponse;
  let next: sinon.SinonSpy;
  let statusStub: sinon.SinonSpy;
  let jsonStub: sinon.SinonSpy;
  let sendStub: sinon.SinonSpy;

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
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createHolding', () => {
    const mockCreateData: CreateHoldingDTO = {
      PORTFOLIOS_ID: '1',
      ISIN: 'US0378331005',
      QUANTITY: 10,
      PRICE: 150.50
    };

    const mockCreatedHolding: HoldingDetails = {
      HOLDINGS_ID: '1',
      PORTFOLIOS_ID: mockCreateData.PORTFOLIOS_ID,
      ISIN: mockCreateData.ISIN,
      QUANTITY: mockCreateData.QUANTITY,
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

    it('should create a holding and return 201 status', async () => {
      req = {
        body: mockCreateData,
        user: { id: 'user1' }
      } as ExpressRequest;

      sinon.stub(holdingService, 'createHolding').resolves(mockCreatedHolding);

      await holdingController.createHolding(req as any, res as any, next);

      expect(statusStub.calledWith(201)).to.be.true;
      expect(jsonStub.calledWith(mockCreatedHolding)).to.be.true;
    });

    it('should return 403 if user is not authorized', async () => {
      req = {
        body: mockCreateData,
        user: { id: 'user2' }
      } as ExpressRequest;

      const error = new Error('Unauthorized');
      sinon.stub(holdingService, 'createHolding').rejects(error);

      await holdingController.createHolding(req as any, res as any, next);

      expect(statusStub.calledWith(403)).to.be.true;
      expect(jsonStub.calledWith({ error: 'Unauthorized' })).to.be.true;
    });

    it('should call next with error for other errors', async () => {
      req = {
        body: mockCreateData,
        user: { id: 'user1' }
      } as ExpressRequest;

      const error = new Error('Database error');
      sinon.stub(holdingService, 'createHolding').rejects(error);

      await holdingController.createHolding(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
