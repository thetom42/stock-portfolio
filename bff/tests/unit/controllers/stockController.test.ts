import { expect } from 'chai';
import sinon from 'sinon';
import { stockService } from '../../../src/services/stockService';
import * as stockController from '../../../src/controllers/stockController';
import { Stock } from '../../../src/models/Stock';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
import type { Response } from '../../../src/types/express';

describe('StockController', () => {
  // Date matcher for response verification
  const dateMatcher = { kind: 'date' };

  const mockStock = {
    id: 'US0378331005',
    isin: 'US0378331005',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currency: 'USD',
    exchange: 'NASDAQ',
    country: 'US',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockSearchResult = {
    id: 'US0378331005',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    currency: 'USD'
  };

  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;
  beforeEach(() => {
    res = createMockResponse();
    next = sinon.spy();
    // Stub stockService methods
    sinon.stub(stockService, 'getStockByIsin');
    sinon.stub(stockService, 'searchStocks');
    sinon.stub(stockService, 'getStockByWkn');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getStockByIsin', () => {
    it('should return stock if found', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      (stockService.getStockByIsin as sinon.SinonStub).resolves(mockStock);

      await stockController.getStockByIsin(req as any, res as unknown as Response, next);

      verifyResponse(res, 200, { stock: { ...mockStock, createdAt: dateMatcher, updatedAt: dateMatcher } });
    });

    it('should return 404 if stock not found', async () => {
      req = createMockRequest({ params: { isin: 'INVALID' } });
      (stockService.getStockByIsin as sinon.SinonStub).resolves(null);

      await stockController.getStockByIsin(req as any, res as unknown as Response, next);

      verifyResponse(res, 404, { error: 'Stock not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { isin: 'US0378331005' } });
      const error = new Error('Failed to fetch stock');
      (stockService.getStockByIsin as sinon.SinonStub).rejects(error);

      await stockController.getStockByIsin(req as any, res as unknown as Response, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('searchStocks', () => {
    it('should return matching stocks', async () => {
      req = createMockRequest({ query: { query: 'Apple' } });
      (stockService.searchStocks as sinon.SinonStub).resolves([mockSearchResult]);

      await stockController.searchStocks(req as any, res as unknown as Response, next);

      verifyResponse(res, 200, { stocks: [mockSearchResult] });
    });

    it('should return empty array if no matches found', async () => {
      req = createMockRequest({ query: { query: 'NonExistent' } });
      (stockService.searchStocks as sinon.SinonStub).resolves([]);

      await stockController.searchStocks(req as any, res as unknown as Response, next);

      verifyResponse(res, 200, { stocks: [] });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ query: { query: 'Apple' } });
      const error = new Error('Failed to search stocks');
      (stockService.searchStocks as sinon.SinonStub).rejects(error);

      await stockController.searchStocks(req as any, res as unknown as Response, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getStockByWkn', () => {
    it('should return stock if found', async () => {
      req = createMockRequest({ params: { wkn: '865985' } });
      (stockService.getStockByWkn as sinon.SinonStub).resolves(mockStock);

      await stockController.getStockByWkn(req as any, res as unknown as Response, next);

      verifyResponse(res, 200, { stock: { ...mockStock, createdAt: dateMatcher, updatedAt: dateMatcher } });
    });

    it('should return 404 if stock not found', async () => {
      req = createMockRequest({ params: { wkn: 'INVALID' } });
      (stockService.getStockByWkn as sinon.SinonStub).resolves(null);

      await stockController.getStockByWkn(req as any, res as unknown as Response, next);

      verifyResponse(res, 404, { error: 'Stock not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { wkn: '865985' } });
      const error = new Error('Failed to fetch stock');
      (stockService.getStockByWkn as sinon.SinonStub).rejects(error);

      await stockController.getStockByWkn(req as any, res as unknown as Response, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
