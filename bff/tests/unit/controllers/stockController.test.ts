import { expect, use } from 'chai';
import spies from 'chai-spies';
import { Request, Response } from 'express';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as stockService from '../../../src/services/stockService';
import * as stockController from '../../../src/controllers/stockController';
import { Stock, StockSearchResult, StockDetails } from '../../../src/models/Stock';

use(spies);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('StockController', () => {
  let req: Partial<Request>;
  let res: MockResponse;
  let next: any;

  const mockStock: Stock = {
    id: '1',
    symbol: 'AAPL',
    isin: 'US0378331005',
    name: 'Apple Inc.',
    currency: 'USD',
    exchange: 'NASDAQ',
    country: 'USA',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockStockDetails: StockDetails = {
    ...mockStock,
    currentPrice: 150.25,
    priceChange: 2.5,
    priceChangePercentage: 1.67,
    marketCap: 2500000000000,
    volume: 82500000,
    peRatio: 28.5,
    dividendYield: 0.65,
    yearHigh: 155.0,
    yearLow: 120.0
  };

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

  describe('getStockByISIN', () => {
    it('should return stock if found', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as Request<{ isin: string }>;

      chai.spy.on(stockService, 'getStockByISIN', () => Promise.resolve(mockStock));

      await stockController.getStockByISIN(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockStock);
    });

    it('should return 404 if stock not found', async () => {
      req = {
        params: { isin: 'INVALID' }
      } as Request<{ isin: string }>;

      chai.spy.on(stockService, 'getStockByISIN', () => Promise.resolve(null));

      await stockController.getStockByISIN(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Stock not found' });
    });
  });

  describe('getStockBySymbol', () => {
    it('should return stock if found', async () => {
      req = {
        params: { symbol: 'AAPL' }
      } as Request<{ symbol: string }>;

      chai.spy.on(stockService, 'getStockBySymbol', () => Promise.resolve(mockStock));

      await stockController.getStockBySymbol(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockStock);
    });

    it('should return 404 if stock not found', async () => {
      req = {
        params: { symbol: 'INVALID' }
      } as Request<{ symbol: string }>;

      chai.spy.on(stockService, 'getStockBySymbol', () => Promise.resolve(null));

      await stockController.getStockBySymbol(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Stock not found' });
    });
  });

  describe('getStockByWKN', () => {
    it('should return stock if found', async () => {
      req = {
        params: { wkn: '865985' }
      } as Request<{ wkn: string }>;

      chai.spy.on(stockService, 'getStockByWKN', () => Promise.resolve(mockStock));

      await stockController.getStockByWKN(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockStock);
    });

    it('should return 404 if stock not found', async () => {
      req = {
        params: { wkn: 'INVALID' }
      } as Request<{ wkn: string }>;

      chai.spy.on(stockService, 'getStockByWKN', () => Promise.resolve(null));

      await stockController.getStockByWKN(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Stock not found' });
    });
  });

  describe('getAllStocks', () => {
    it('should return all stocks', async () => {
      const mockStocks = [mockStock];
      req = {} as Request;

      chai.spy.on(stockService, 'getAllStocks', () => Promise.resolve(mockStocks));

      await stockController.getAllStocks(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockStocks);
    });

    it('should call next with error if retrieval fails', async () => {
      req = {} as Request;

      const error = new Error('Database error');
      chai.spy.on(stockService, 'getAllStocks', () => Promise.reject(error));

      await stockController.getAllStocks(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });

  describe('getStocksByCategory', () => {
    it('should return stocks for category', async () => {
      const mockStocks = [mockStock];
      req = {
        params: { categoryId: '1' }
      } as Request<{ categoryId: string }>;

      chai.spy.on(stockService, 'getStocksByCategory', () => Promise.resolve(mockStocks));

      await stockController.getStocksByCategory(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockStocks);
    });
  });

  describe('searchStocks', () => {
    const mockSearchResults: StockSearchResult[] = [{
      id: '1',
      symbol: 'AAPL',
      name: 'Apple Inc.',
      exchange: 'NASDAQ',
      currency: 'USD'
    }];

    it('should return search results', async () => {
      req = {
        query: { query: 'Apple' }
      } as Request<{}, {}, {}, { query: string }>;

      chai.spy.on(stockService, 'searchStocks', () => Promise.resolve(mockSearchResults));

      await stockController.searchStocks(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockSearchResults);
    });
  });

  describe('getStockDetails', () => {
    it('should return stock details if found', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as Request<{ isin: string }>;

      chai.spy.on(stockService, 'getStockDetails', () => Promise.resolve(mockStockDetails));

      await stockController.getStockDetails(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockStockDetails);
    });

    it('should return 404 if stock not found', async () => {
      req = {
        params: { isin: 'INVALID' }
      } as Request<{ isin: string }>;

      chai.spy.on(stockService, 'getStockDetails', () => Promise.resolve(null));

      await stockController.getStockDetails(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Stock not found' });
    });
  });

  describe('createStock', () => {
    const createStockData = {
      isin: 'US0378331005',
      name: 'Apple Inc.',
      wkn: '865985',
      symbol: 'AAPL',
      categoryId: '1'
    };

    it('should create stock and return 201 status', async () => {
      req = {
        body: createStockData
      } as Request;

      chai.spy.on(stockService, 'createStock', () => Promise.resolve(mockStock));

      await stockController.createStock(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(201);
      expect(res.json).to.have.been.called.with(mockStock);
    });

    it('should call next with error if creation fails', async () => {
      req = {
        body: createStockData
      } as Request;

      const error = new Error('Database error');
      chai.spy.on(stockService, 'createStock', () => Promise.reject(error));

      await stockController.createStock(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });

  describe('updateStock', () => {
    const updateStockData = {
      name: 'Updated Apple Inc.',
      categoryId: '2'
    };

    it('should update stock and return updated data', async () => {
      req = {
        params: { isin: 'US0378331005' },
        body: updateStockData
      } as Request<{ isin: string }>;

      const updatedStock = { ...mockStock, ...updateStockData };
      chai.spy.on(stockService, 'updateStock', () => Promise.resolve(updatedStock));

      await stockController.updateStock(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(updatedStock);
    });

    it('should return 404 if stock not found', async () => {
      req = {
        params: { isin: 'INVALID' },
        body: updateStockData
      } as Request<{ isin: string }>;

      chai.spy.on(stockService, 'updateStock', () => Promise.resolve(null));

      await stockController.updateStock(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ message: 'Stock not found' });
    });
  });

  describe('deleteStock', () => {
    it('should delete stock and return 204 status', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as Request<{ isin: string }>;

      chai.spy.on(stockService, 'deleteStock', () => Promise.resolve());

      await stockController.deleteStock(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(204);
      expect(res.send).to.have.been.called();
    });

    it('should call next with error if deletion fails', async () => {
      req = {
        params: { isin: 'US0378331005' }
      } as Request<{ isin: string }>;

      const error = new Error('Database error');
      chai.spy.on(stockService, 'deleteStock', () => Promise.reject(error));

      await stockController.deleteStock(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });
});
