import { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chai from 'chai';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express-serve-static-core';
import * as stockController from '../../../src/controllers/stockController';
import * as database from '../../../src/utils/database';
import { createMockPrismaClient } from '../../helpers/mockPrisma';

chai.use(sinonChai);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('StockController', () => {
  let req: Partial<ExpressRequest>;
  let res: MockResponse;
  let next: sinon.SinonSpy;
  let statusStub: sinon.SinonSpy;
  let jsonStub: sinon.SinonSpy;
  let sendStub: sinon.SinonSpy;
  let mockPrismaClient: any;

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

    mockPrismaClient = createMockPrismaClient();
    sinon.stub(database, 'getPrismaClient').returns(mockPrismaClient);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getStockByISIN', () => {
    const mockStock = {
      STOCKS_ID: '1',
      ISIN: 'US0378331005',
      SYMBOL: 'AAPL',
      NAME: 'Apple Inc.',
      CURRENCY: 'USD',
      EXCHANGE: 'NASDAQ',
      COUNTRY: 'USA',
      CREATED_AT: new Date(),
      UPDATED_AT: new Date()
    };

    it('should return stock if found', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as any;

      mockPrismaClient.stock.findUnique.resolves(mockStock);

      await stockController.getStockByISIN(req as any, res as any, next);

      expect(mockPrismaClient.stock.findUnique).to.have.been.calledWith({
        where: { ISIN: 'US0378331005' }
      });
      expect(jsonStub).to.have.been.calledWith(mockStock);
    });

    it('should return 404 if stock not found', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as any;

      mockPrismaClient.stock.findUnique.resolves(null);

      await stockController.getStockByISIN(req as any, res as any, next);

      expect(statusStub).to.have.been.calledWith(404);
      expect(jsonStub).to.have.been.calledWith({ error: 'Stock not found' });
    });

    it('should handle errors gracefully', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as any;

      const error = new Error('Database error');
      mockPrismaClient.stock.findUnique.rejects(error);

      await stockController.getStockByISIN(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });

  describe('searchStocks', () => {
    const mockStocks = [
      {
        STOCKS_ID: '1',
        ISIN: 'US0378331005',
        SYMBOL: 'AAPL',
        NAME: 'Apple Inc.',
        CURRENCY: 'USD',
        EXCHANGE: 'NASDAQ',
        COUNTRY: 'USA',
        CREATED_AT: new Date(),
        UPDATED_AT: new Date()
      }
    ];

    it('should return matching stocks', async () => {
      req = {
        query: { q: 'Apple' }
      } as any;

      mockPrismaClient.stock.findMany.resolves(mockStocks);

      await stockController.searchStocks(req as any, res as any, next);

      expect(mockPrismaClient.stock.findMany).to.have.been.called;
      expect(jsonStub).to.have.been.calledWith(mockStocks);
    });

    it('should return empty array if no matches found', async () => {
      req = {
        query: { q: 'NonexistentStock' }
      } as any;

      mockPrismaClient.stock.findMany.resolves([]);

      await stockController.searchStocks(req as any, res as any, next);

      expect(jsonStub).to.have.been.calledWith([]);
    });

    it('should handle errors gracefully', async () => {
      req = {
        query: { q: 'Apple' }
      } as any;

      const error = new Error('Database error');
      mockPrismaClient.stock.findMany.rejects(error);

      await stockController.searchStocks(req as any, res as any, next);

      expect(next).to.have.been.calledWith(error);
    });
  });
});
