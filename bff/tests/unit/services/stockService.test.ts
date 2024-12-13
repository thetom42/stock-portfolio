import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { 
  mockStockRepo,
  setupRepositoryMocks, 
  resetRepositoryMocks 
} from '../../helpers/mockRepositories';
import * as stockService from '../../../src/services/stockService';
import * as yahooFinanceService from '../../../src/services/yahooFinanceService';
import { YahooFinanceQuote, YahooFinanceSearchResult } from '../../../src/services/yahooFinanceService';

describe('StockService', () => {
  const mockStock = {
    isin: 'US0378331005',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    wkn: '123456',
    category_id: 'tech-category'
  };

  const mockYahooQuote: YahooFinanceQuote = {
    price: 150.50,
    currency: 'USD',
    exchange: 'NASDAQ',
    timestamp: 1625097600000,
    volume: 1000000,
    open: 149.50,
    high: 152.00,
    low: 148.50,
    close: 150.50
  };

  const mockSearchResult: YahooFinanceSearchResult = {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    type: 'EQUITY'
  };

  beforeEach(() => {
    setupRepositoryMocks();
    // Inject the mock repository
    stockService.setStockRepository(mockStockRepo);
    sinon.stub(yahooFinanceService, 'getYahooFinanceService').returns({
      getRealTimeQuote: sinon.stub().resolves(mockYahooQuote),
      searchStocks: sinon.stub().resolves([mockSearchResult])
    } as any);
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  describe('getStockByIsin', () => {
    it('should return stock when found', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);

      const result = await stockService.getStockByIsin(mockStock.isin);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      sinon.assert.calledWith(mockStockRepo.findByIsin, mockStock.isin);
    });

    it('should return null when stock not found', async () => {
      mockStockRepo.findByIsin.resolves(null);

      const result = await stockService.getStockByIsin('invalid-isin');
      expect(result).to.be.null;
      sinon.assert.calledWith(mockStockRepo.findByIsin, 'invalid-isin');
    });
  });

  describe('getStockBySymbol', () => {
    it('should return stock when found', async () => {
      mockStockRepo.findBySymbol.resolves(mockStock);

      const result = await stockService.getStockBySymbol(mockStock.symbol);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      sinon.assert.calledWith(mockStockRepo.findBySymbol, mockStock.symbol);
    });

    it('should return null when stock not found', async () => {
      mockStockRepo.findBySymbol.resolves(null);

      const result = await stockService.getStockBySymbol('invalid-symbol');
      expect(result).to.be.null;
      sinon.assert.calledWith(mockStockRepo.findBySymbol, 'invalid-symbol');
    });
  });

  describe('getStockByWkn', () => {
    it('should return stock when found', async () => {
      mockStockRepo.findByWkn.resolves(mockStock);

      const result = await stockService.getStockByWkn(mockStock.wkn);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      sinon.assert.calledWith(mockStockRepo.findByWkn, mockStock.wkn);
    });

    it('should return null when stock not found', async () => {
      mockStockRepo.findByWkn.resolves(null);

      const result = await stockService.getStockByWkn('invalid-wkn');
      expect(result).to.be.null;
      sinon.assert.calledWith(mockStockRepo.findByWkn, 'invalid-wkn');
    });
  });

  describe('getAllStocks', () => {
    it('should return all stocks', async () => {
      mockStockRepo.findAll.resolves([mockStock]);

      const result = await stockService.getAllStocks();

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      sinon.assert.called(mockStockRepo.findAll);
    });

    it('should return empty array when no stocks exist', async () => {
      mockStockRepo.findAll.resolves([]);

      const result = await stockService.getAllStocks();
      expect(result).to.be.an('array').that.is.empty;
      sinon.assert.called(mockStockRepo.findAll);
    });
  });

  describe('getStocksByCategory', () => {
    it('should return stocks for category', async () => {
      mockStockRepo.findByCategory.resolves([mockStock]);

      const result = await stockService.getStocksByCategory('tech-category');

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      sinon.assert.calledWith(mockStockRepo.findByCategory, 'tech-category');
    });

    it('should return empty array when no stocks in category', async () => {
      mockStockRepo.findByCategory.resolves([]);

      const result = await stockService.getStocksByCategory('empty-category');
      expect(result).to.be.an('array').that.is.empty;
      sinon.assert.calledWith(mockStockRepo.findByCategory, 'empty-category');
    });
  });

  describe('searchStocks', () => {
    it('should return search results', async () => {
      const result = await stockService.searchStocks('AAPL');

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        symbol: mockSearchResult.symbol,
        name: mockSearchResult.name,
        exchange: mockSearchResult.exchange
      });
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      sinon.assert.calledWith(yahooService.searchStocks, 'AAPL');
    });

    it('should handle Yahoo Finance API errors', async () => {
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.searchStocks.rejects(new Error('API Error'));

      const result = await stockService.searchStocks('AAPL');
      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getStockDetails', () => {
    it('should return detailed stock information when found', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);

      const result = await stockService.getStockDetails(mockStock.isin);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name,
        currentPrice: mockYahooQuote.price,
        currency: mockYahooQuote.currency,
        exchange: mockYahooQuote.exchange
      });
      expect(result).to.have.property('priceChange');
      expect(result).to.have.property('priceChangePercentage');
      sinon.assert.calledWith(mockStockRepo.findByIsin, mockStock.isin);
    });

    it('should return null when stock not found', async () => {
      mockStockRepo.findByIsin.resolves(null);

      const result = await stockService.getStockDetails('invalid-isin');
      expect(result).to.be.null;
      sinon.assert.calledWith(mockStockRepo.findByIsin, 'invalid-isin');
    });

    it('should return basic stock info when Yahoo Finance fails', async () => {
      mockStockRepo.findByIsin.resolves(mockStock);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.getRealTimeQuote.rejects(new Error('Yahoo Finance error'));

      const result = await stockService.getStockDetails(mockStock.isin);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      sinon.assert.calledWith(mockStockRepo.findByIsin, mockStock.isin);
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
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      sinon.assert.calledWith(mockStockRepo.create, {
        isin: createData.isin,
        category_id: 'tech-category',
        name: createData.name,
        wkn: createData.wkn,
        symbol: createData.symbol
      });
    });
  });

  describe('updateStock', () => {
    const updateData = {
      name: 'Updated Apple Inc.',
      categoryId: 'new-category'
    };

    it('should update stock when found', async () => {
      const updatedStock = { ...mockStock, name: updateData.name, category_id: updateData.categoryId };
      mockStockRepo.update.resolves(updatedStock);

      const result = await stockService.updateStock(mockStock.isin, updateData);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        name: updateData.name
      });
      sinon.assert.calledWith(mockStockRepo.update, mockStock.isin, {
        name: updateData.name,
        category_id: updateData.categoryId
      });
    });

    it('should return null when stock not found', async () => {
      mockStockRepo.update.resolves(undefined);

      const result = await stockService.updateStock('invalid-isin', updateData);
      expect(result).to.be.null;
      sinon.assert.calledWith(mockStockRepo.update, 'invalid-isin', {
        name: updateData.name,
        category_id: updateData.categoryId
      });
    });
  });

  describe('deleteStock', () => {
    it('should delete stock successfully', async () => {
      mockStockRepo.delete.resolves();

      await stockService.deleteStock(mockStock.isin);
      sinon.assert.calledWith(mockStockRepo.delete, mockStock.isin);
    });
  });
});
