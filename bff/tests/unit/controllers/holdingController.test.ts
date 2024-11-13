import { expect } from 'chai';
import sinon from 'sinon';
import * as holdingService from '../../../src/services/holdingService';
import * as holdingController from '../../../src/controllers/holdingController';
import { CreateHoldingDTO, HoldingDetails } from '../../../src/models/Holding';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
import { setupRepositoryMocks, resetRepositoryMocks, mockHoldingRepo } from '../../helpers/mockRepositories';

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
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      sinon.stub(holdingService, 'createHolding').resolves(mockCreatedHolding);

      await holdingController.createHolding(req as any, res, next);

      verifyResponse(res, 201, { holding: mockCreatedHolding });
    });

    it('should return 403 if user is not authorized', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user2' }
      });

      const error = new Error('Unauthorized');
      sinon.stub(holdingService, 'createHolding').rejects(error);

      await holdingController.createHolding(req as any, res, next);

      verifyResponse(res, 403, { error: 'Unauthorized' });
    });

    it('should call next with error for other errors', async () => {
      req = createMockRequest({
        body: mockCreateData,
        user: { id: 'user1' }
      });

      const error = new Error('Database error');
      sinon.stub(holdingService, 'createHolding').rejects(error);

      await holdingController.createHolding(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
