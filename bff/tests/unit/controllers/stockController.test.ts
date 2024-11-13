import { expect } from 'chai';
import sinon from 'sinon';
import * as stockService from '../../../src/services/stockService';
import * as stockController from '../../../src/controllers/stockController';
import { Stock } from '../../../src/models/Stock';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
import { setupRepositoryMocks, resetRepositoryMocks, mockStockRepo } from '../../helpers/mockRepositories';

describe('StockController', () => {
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

  describe('getStockByISIN', () => {
    const mockStock: Stock = {
      id: '1',
      isin: 'US0378331005',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      currency: 'USD',
      exchange: 'NASDAQ',
      country: 'USA',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should return stock if found', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      sinon.stub(stockService, 'getStockByISIN').resolves(mockStock);

      await stockController.getStockByISIN(req as any, res, next);

      verifyResponse(res, 200, { stock: mockStock });
    });

    it('should return 404 if stock not found', async () => {
      req = createMockRequest({ params: { isin: 'INVALID' } });
      sinon.stub(stockService, 'getStockByISIN').resolves(null);

      await stockController.getStockByISIN(req as any, res, next);

      verifyResponse(res, 404, { error: 'Stock not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      const error = new Error('Database error');
      sinon.stub(stockService, 'getStockByISIN').rejects(error);

      await stockController.getStockByISIN(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('searchStocks', () => {
    const mockStocks: Stock[] = [
      {
        id: '1',
        isin: 'US0378331005',
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currency: 'USD',
        exchange: 'NASDAQ',
        country: 'USA',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        isin: 'US5949181045',
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        currency: 'USD',
        exchange: 'NASDAQ',
        country: 'USA',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    it('should return matching stocks', async () => {
      req = createMockRequest({ query: { query: 'Apple' } });
      sinon.stub(stockService, 'searchStocks').resolves(mockStocks);

      await stockController.searchStocks(req as any, res, next);

      verifyResponse(res, 200, { stocks: mockStocks });
    });

    it('should return empty array if no matches found', async () => {
      req = createMockRequest({ query: { query: 'NonExistent' } });
      sinon.stub(stockService, 'searchStocks').resolves([]);

      await stockController.searchStocks(req as any, res, next);

      verifyResponse(res, 200, { stocks: [] });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ query: { query: 'Apple' } });
      const error = new Error('Database error');
      sinon.stub(stockService, 'searchStocks').rejects(error);

      await stockController.searchStocks(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
