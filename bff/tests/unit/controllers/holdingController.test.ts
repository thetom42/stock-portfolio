import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import { Request, Response } from 'express';
import * as holdingService from '../../../src/services/holdingService';
import * as holdingController from '../../../src/controllers/holdingController';
import { 
  Holding, 
  CreateHoldingDTO, 
  UpdateHoldingDTO, 
  HoldingDetails,
  HoldingPerformance,
  HoldingValue,
  HoldingHistory
} from '../../../src/models/Holding';

use(spies);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('HoldingController', () => {
  let req: Partial<Request>;
  let res: MockResponse;
  let next: any;

  const userId = 'user123';

  beforeEach(() => {
    res = {
      status: chai.spy(function(this: MockResponse, code: number) { return this; }),
      json: chai.spy(),
      send: chai.spy()
    };
    next = chai.spy();
  });

  afterEach(() => {
    chai.spy.restore();
  });

  describe('createHolding', () => {
    const mockHoldingData: CreateHoldingDTO = {
      PORTFOLIOS_ID: 'portfolio123',
      ISIN: 'US0378331005',
      QUANTITY: 100,
      PRICE: 150.50
    };

    const mockCreatedHolding: HoldingDetails = {
      HOLDINGS_ID: 'holding123',
      PORTFOLIOS_ID: mockHoldingData.PORTFOLIOS_ID,
      ISIN: mockHoldingData.ISIN,
      QUANTITY: mockHoldingData.QUANTITY,
      START_DATE: new Date(),
      END_DATE: null,
      stock: {
        symbol: 'AAPL',
        name: 'Apple Inc',
        currency: 'USD'
      },
      currentPrice: 155.00,
      totalValue: 15500,
      gainLoss: 450,
      gainLossPercentage: 3
    };

    it('should create a holding and return 201 status', async () => {
      req = {
        user: { id: userId },
        body: mockHoldingData
      } as any;

      chai.spy.on(holdingService, 'createHolding', () => Promise.resolve(mockCreatedHolding));

      await holdingController.createHolding(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(201);
      expect(res.json).to.have.been.called.with(mockCreatedHolding);
    });

    it('should call next with error if creation fails', async () => {
      req = {
        user: { id: userId },
        body: mockHoldingData
      } as any;

      const error = new Error('Creation failed');
      chai.spy.on(holdingService, 'createHolding', () => Promise.reject(error));

      await holdingController.createHolding(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });

  describe('getHolding', () => {
    const mockHolding: HoldingDetails = {
      HOLDINGS_ID: 'holding123',
      PORTFOLIOS_ID: 'portfolio123',
      ISIN: 'US0378331005',
      QUANTITY: 100,
      START_DATE: new Date(),
      END_DATE: null,
      stock: {
        symbol: 'AAPL',
        name: 'Apple Inc',
        currency: 'USD'
      },
      currentPrice: 155.00,
      totalValue: 15500,
      gainLoss: 450,
      gainLossPercentage: 3
    };

    it('should return holding if found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'holding123' }
      } as any;

      chai.spy.on(holdingService, 'getHoldingById', () => Promise.resolve(mockHolding));

      await holdingController.getHolding(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockHolding);
    });

    it('should return 404 if holding not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' }
      } as any;

      chai.spy.on(holdingService, 'getHoldingById', () => Promise.resolve(null));

      await holdingController.getHolding(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Holding not found' });
    });
  });

  describe('updateHolding', () => {
    const mockUpdateData: UpdateHoldingDTO = {
      QUANTITY: 150
    };

    const mockUpdatedHolding: HoldingDetails = {
      HOLDINGS_ID: 'holding123',
      PORTFOLIOS_ID: 'portfolio123',
      ISIN: 'US0378331005',
      QUANTITY: 150,
      START_DATE: new Date(),
      END_DATE: null,
      stock: {
        symbol: 'AAPL',
        name: 'Apple Inc',
        currency: 'USD'
      },
      currentPrice: 155.00,
      totalValue: 23250,
      gainLoss: 675,
      gainLossPercentage: 3
    };

    it('should update holding successfully', async () => {
      req = {
        user: { id: userId },
        params: { id: 'holding123' },
        body: mockUpdateData
      } as any;

      chai.spy.on(holdingService, 'updateHolding', () => Promise.resolve(mockUpdatedHolding));

      await holdingController.updateHolding(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockUpdatedHolding);
    });

    it('should return 404 if holding not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' },
        body: mockUpdateData
      } as any;

      chai.spy.on(holdingService, 'updateHolding', () => Promise.resolve(null));

      await holdingController.updateHolding(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Holding not found' });
    });
  });

  describe('getHoldingPerformance', () => {
    const mockPerformance: HoldingPerformance = {
      totalInvested: 15000,
      currentValue: 15500,
      totalReturn: 500,
      totalReturnPercentage: 3.33,
      transactions: []
    };

    it('should return holding performance', async () => {
      req = {
        user: { id: userId },
        params: { id: 'holding123' }
      } as any;

      chai.spy.on(holdingService, 'getHoldingPerformance', () => Promise.resolve(mockPerformance));

      await holdingController.getHoldingPerformance(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockPerformance);
    });

    it('should return 404 if holding not found', async () => {
      req = {
        user: { id: userId },
        params: { id: 'nonexistent' }
      } as any;

      chai.spy.on(holdingService, 'getHoldingPerformance', () => Promise.resolve(null));

      await holdingController.getHoldingPerformance(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Holding not found' });
    });
  });

  describe('getHoldingValue', () => {
    const mockValue: HoldingValue = {
      quantity: 100,
      costBasis: 15000,
      averageCost: 150,
      currentValue: 15500,
      unrealizedGainLoss: 500
    };

    it('should return holding value', async () => {
      req = {
        user: { id: userId },
        params: { id: 'holding123' }
      } as any;

      chai.spy.on(holdingService, 'getHoldingValue', () => Promise.resolve(mockValue));

      await holdingController.getHoldingValue(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockValue);
    });
  });

  describe('deleteHolding', () => {
    it('should delete holding and return 204 status', async () => {
      req = {
        user: { id: userId },
        params: { id: 'holding123' }
      } as any;

      chai.spy.on(holdingService, 'deleteHolding', () => Promise.resolve());

      await holdingController.deleteHolding(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(204);
      expect(res.send).to.have.been.called();
    });

    it('should call next with error if deletion fails', async () => {
      req = {
        user: { id: userId },
        params: { id: 'holding123' }
      } as any;

      const error = new Error('Deletion failed');
      chai.spy.on(holdingService, 'deleteHolding', () => Promise.reject(error));

      await holdingController.deleteHolding(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });
});
