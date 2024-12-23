import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { StockService } from '../../../src/services/stockService';
import { setupMockStockRepo, resetAllMocks } from '../../helpers/mockRepositories';
import * as yahooFinanceService from '../../../src/services/yahooFinanceService';
import { YahooFinanceQuote, YahooFinanceSearchResult } from '../../../src/services/yahooFinanceService';

describe('StockService', () => {
  let mockRepo: any;
  let testStockService: StockService;

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
    const setup = setupMockStockRepo();
    mockRepo = setup.mockRepo;

    // Create a new StockService instance with mock repository
    testStockService = new StockService(mockRepo);

    sinon.stub(yahooFinanceService, 'getYahooFinanceService').returns({
      getRealTimeQuote: sinon.stub().resolves(mockYahooQuote),
      searchStocks: sinon.stub().resolves([mockSearchResult])
    } as any);
  });

  afterEach(() => {
    resetAllMocks();
    sinon.restore();
  });

  describe('getStockByIsin', () => {
    it('should return stock when found', async () => {
      mockRepo.findByIsin.resolves(mockStock);

      const result = await testStockService.getStockByIsin(mockStock.isin);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      expect(mockRepo.findByIsin.calledWith(mockStock.isin)).to.be.true;
    });

    it('should return null when stock not found', async () => {
      mockRepo.findByIsin.resolves(null);

      const result = await testStockService.getStockByIsin('invalid-isin');
      expect(result).to.be.null;
      expect(mockRepo.findByIsin.calledWith('invalid-isin')).to.be.true;
    });
  });

  describe('getStockBySymbol', () => {
    it('should return stock when found', async () => {
      mockRepo.findBySymbol.resolves(mockStock);

      const result = await testStockService.getStockBySymbol(mockStock.symbol);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      expect(mockRepo.findBySymbol.calledWith(mockStock.symbol)).to.be.true;
    });

    it('should return null when stock not found', async () => {
      mockRepo.findBySymbol.resolves(null);

      const result = await testStockService.getStockBySymbol('invalid-symbol');
      expect(result).to.be.null;
      expect(mockRepo.findBySymbol.calledWith('invalid-symbol')).to.be.true;
    });
  });

  describe('getStockByWkn', () => {
    it('should return stock when found', async () => {
      mockRepo.findByWkn.resolves(mockStock);

      const result = await testStockService.getStockByWkn(mockStock.wkn);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      expect(mockRepo.findByWkn.calledWith(mockStock.wkn)).to.be.true;
    });

    it('should return null when stock not found', async () => {
      mockRepo.findByWkn.resolves(null);

      const result = await testStockService.getStockByWkn('invalid-wkn');
      expect(result).to.be.null;
      expect(mockRepo.findByWkn.calledWith('invalid-wkn')).to.be.true;
    });
  });

  describe('getAllStocks', () => {
    it('should return all stocks', async () => {
      mockRepo.findAll.resolves([mockStock]);

      const result = await testStockService.getAllStocks();

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      expect(mockRepo.findAll.called).to.be.true;
    });

    it('should return empty array when no stocks exist', async () => {
      mockRepo.findAll.resolves([]);

      const result = await testStockService.getAllStocks();
      expect(result).to.be.an('array').that.is.empty;
      expect(mockRepo.findAll.called).to.be.true;
    });
  });

  describe('getStocksByCategory', () => {
    it('should return stocks for category', async () => {
      mockRepo.findByCategory.resolves([mockStock]);

      const result = await testStockService.getStocksByCategory('tech-category');

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      expect(mockRepo.findByCategory.calledWith('tech-category')).to.be.true;
    });

    it('should return empty array when no stocks in category', async () => {
      mockRepo.findByCategory.resolves([]);

      const result = await testStockService.getStocksByCategory('empty-category');
      expect(result).to.be.an('array').that.is.empty;
      expect(mockRepo.findByCategory.calledWith('empty-category')).to.be.true;
    });
  });

  describe('searchStocks', () => {
    it('should return search results', async () => {
      const result = await testStockService.searchStocks('AAPL');

      expect(result).to.be.an('array');
      expect(result[0]).to.deep.include({
        symbol: mockSearchResult.symbol,
        name: mockSearchResult.name,
        exchange: mockSearchResult.exchange
      });
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      expect(yahooService.searchStocks.calledWith('AAPL')).to.be.true;
    });

    it('should handle Yahoo Finance API errors', async () => {
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.searchStocks.rejects(new Error('API Error'));

      const result = await testStockService.searchStocks('AAPL');
      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('getStockDetails', () => {
    it('should return detailed stock information when found', async () => {
      mockRepo.findByIsin.resolves(mockStock);

      const result = await testStockService.getStockDetails(mockStock.isin);

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
      expect(mockRepo.findByIsin.calledWith(mockStock.isin)).to.be.true;
    });

    it('should return null when stock not found', async () => {
      mockRepo.findByIsin.resolves(null);

      const result = await testStockService.getStockDetails('invalid-isin');
      expect(result).to.be.null;
      expect(mockRepo.findByIsin.calledWith('invalid-isin')).to.be.true;
    });

    it('should return basic stock info when Yahoo Finance fails', async () => {
      mockRepo.findByIsin.resolves(mockStock);
      const yahooService = yahooFinanceService.getYahooFinanceService() as any;
      yahooService.getRealTimeQuote.rejects(new Error('Yahoo Finance error'));

      const result = await testStockService.getStockDetails(mockStock.isin);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      expect(mockRepo.findByIsin.calledWith(mockStock.isin)).to.be.true;
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
      mockRepo.create.resolves(mockStock);

      const result = await testStockService.createStock('tech-category', createData);

      expect(result).to.deep.include({
        id: mockStock.isin,
        symbol: mockStock.symbol,
        name: mockStock.name
      });
      expect(mockRepo.create.firstCall.args[0]).to.deep.equal({
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
      mockRepo.update.resolves(updatedStock);

      const result = await testStockService.updateStock(mockStock.isin, updateData);

      expect(result).to.not.be.null;
      expect(result).to.deep.include({
        id: mockStock.isin,
        name: updateData.name
      });
      expect(mockRepo.update.firstCall.args).to.deep.equal([
        mockStock.isin,
        {
          name: updateData.name,
          category_id: updateData.categoryId
        }
      ]);
    });

    it('should return null when stock not found', async () => {
      mockRepo.update.resolves(null);

      const result = await testStockService.updateStock('invalid-isin', updateData);
      expect(result).to.be.null;
      expect(mockRepo.update.firstCall.args).to.deep.equal([
        'invalid-isin',
        {
          name: updateData.name,
          category_id: updateData.categoryId
        }
      ]);
    });
  });

  describe('deleteStock', () => {
    it('should delete stock successfully', async () => {
      mockRepo.delete.resolves();

      await testStockService.deleteStock(mockStock.isin);
      expect(mockRepo.delete.calledWith(mockStock.isin)).to.be.true;
    });
  });
});
