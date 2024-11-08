import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import { 
  mockStockRepo,
  setupRepositoryMocks, 
  resetRepositoryMocks 
} from '../../helpers/mockRepositories';
import * as stockService from '../../../src/services/stockService';
import * as yahooFinanceService from '../../../src/services/yahooFinanceService';

use(spies);

describe('StockService', () => {
  const mockStock = {
    ISIN: 'US0378331005',
    SYMBOL: 'AAPL',
    NAME: 'Apple Inc.',
    WKN: '123456',
    CATEGORIES_ID: 'tech-category'
  };

  const mockYahooQuote = {
    price: 150.50,
    currency: 'USD',
    timestamp: new Date().toISOString(),
    exchange: 'NASDAQ',
    open: 149.50,
    volume: 1000000
  };

  beforeEach(() => {
    setupRepositoryMocks();
    sinon.stub(yahooFinanceService, 'getYahooFinanceService').returns({
      getRealTimeQuote: sinon.stub().resolves(mockYahooQuote),
      searchStocks: sinon.stub().resolves([{
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ'
      }])
    } as any);
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  describe('getStockByISIN', () => {
    it('should return stock when found', async () => {
      mockStockRepo.findByISIN.resolves(mockStock);

      const result = await stockService.getStockByISIN(mockStock.ISIN);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.ISIN,
        symbol: mockStock.SYMBOL,
        name: mockStock.NAME
      });
    });

    it('should return null when stock not found', async () => {
      mockStockRepo.findByISIN.resolves(null);

      const result = await stockService.getStockByISIN('invalid-isin');
      expect(result).to.be.null;
    });
  });

  describe('getStockBySymbol', () => {
    it('should return stock when found', async () => {
      mockStockRepo.findBySymbol.resolves(mockStock);

      const result = await stockService.getStockBySymbol(mockStock.SYMBOL);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.ISIN,
        symbol: mockStock.SYMBOL,
        name: mockStock.NAME
      });
    });

    it('should return null when stock not found', async () => {
      mockStockRepo.findBySymbol.resolves(null);

      const result = await stockService.getStockBySymbol('invalid-symbol');
      expect(result).to.be.null;
    });
  });

  describe('getStockByWKN', () => {
    it('should return stock when found', async () => {
      mockStockRepo.findByWKN.resolves(mockStock);

      const result = await stockService.getStockByWKN(mockStock.WKN);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.ISIN,
        symbol: mockStock.SYMBOL,
        name: mockStock.NAME
      });
    });

    it('should return null when stock not found', async () => {
      mockStockRepo.findByWKN.resolves(null);

      const result = await stockService.getStockByWKN('invalid-wkn');
      expect(result).to.be.null;
    });
  });

  describe('getAllStocks', () => {
    it('should return all stocks', async () => {
      mockStockRepo.findAll.resolves([mockStock]);

      const result = await stockService.getAllStocks();

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockStock.ISIN,
        symbol: mockStock.SYMBOL,
        name: mockStock.NAME
      });
    });

    it('should return empty array when no stocks exist', async () => {
      mockStockRepo.findAll.resolves([]);

      const result = await stockService.getAllStocks();
      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getStocksByCategory', () => {
    it('should return stocks for category', async () => {
      mockStockRepo.findByCategory.resolves([mockStock]);

      const result = await stockService.getStocksByCategory('tech-category');

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockStock.ISIN,
        symbol: mockStock.SYMBOL,
        name: mockStock.NAME
      });
    });

    it('should return empty array when no stocks in category', async () => {
      mockStockRepo.findByCategory.resolves([]);

      const result = await stockService.getStocksByCategory('empty-category');
      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('searchStocks', () => {
    it('should return search results', async () => {
      const result = await stockService.searchStocks('AAPL');

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ'
      });
    });
  });

  describe('getStockDetails', () => {
    it('should return detailed stock information when found', async () => {
      mockStockRepo.findByISIN.resolves(mockStock);

      const result = await stockService.getStockDetails(mockStock.ISIN);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.ISIN,
        symbol: mockStock.SYMBOL,
        name: mockStock.NAME,
        currentPrice: mockYahooQuote.price
      });
      expect(result).to.have.property('priceChange');
      expect(result).to.have.property('priceChangePercentage');
    });

    it('should return null when stock not found', async () => {
      mockStockRepo.findByISIN.resolves(null);

      const result = await stockService.getStockDetails('invalid-isin');
      expect(result).to.be.null;
    });

    it('should return basic stock info when Yahoo Finance fails', async () => {
      mockStockRepo.findByISIN.resolves(mockStock);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.getRealTimeQuote.rejects(new Error('Yahoo Finance error'));

      const result = await stockService.getStockDetails(mockStock.ISIN);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.ISIN,
        symbol: mockStock.SYMBOL,
        name: mockStock.NAME
      });
    });
  });

  describe('createStock', () => {
    const createData = {
      isin: 'US0378331005',
      name: 'Apple Inc.',
      wkn: '123456',
      symbol: 'AAPL'
    };

    it('should create new stock', async () => {
      mockStockRepo.create.resolves(mockStock);

      const result = await stockService.createStock('tech-category', createData);

      expect(result).to.deep.include({
        id: mockStock.ISIN,
        symbol: mockStock.SYMBOL,
        name: mockStock.NAME
      });
      expect(mockStockRepo.create.calledOnceWith({
        ISIN: createData.isin,
        CATEGORIES_ID: 'tech-category',
        NAME: createData.name,
        WKN: createData.wkn,
        SYMBOL: createData.symbol
      })).to.be.true;
    });
  });

  describe('updateStock', () => {
    const updateData = {
      name: 'Updated Apple Inc.',
      categoryId: 'new-category'
    };

    it('should update stock when found', async () => {
      const updatedStock = { ...mockStock, NAME: updateData.name, CATEGORIES_ID: updateData.categoryId };
      mockStockRepo.update.resolves(updatedStock);

      const result = await stockService.updateStock(mockStock.ISIN, updateData);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.ISIN,
        name: updateData.name
      });
    });

    it('should return null when stock not found', async () => {
      mockStockRepo.update.resolves(null);

      const result = await stockService.updateStock('invalid-isin', updateData);
      expect(result).to.be.null;
    });
  });

  describe('deleteStock', () => {
    it('should delete stock successfully', async () => {
      mockStockRepo.delete.resolves();

      await stockService.deleteStock(mockStock.ISIN);
      expect(mockStockRepo.delete.calledOnceWith(mockStock.ISIN)).to.be.true;
    });
  });
});
