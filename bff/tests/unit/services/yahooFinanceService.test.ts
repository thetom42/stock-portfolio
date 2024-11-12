import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import { environment } from '../../../src/config/environment';
import { 
  getYahooFinanceService, 
  YahooFinanceQuote, 
  IntradayQuote,
  HistoricalQuote, 
  YahooFinanceSearchResult 
} from '../../../src/services/yahooFinanceService';

interface ServiceError extends Error {
  message: string;
}

describe('YahooFinanceService', () => {
  const mockApiKey = 'test-api-key';
  const mockApiHost = 'yh-finance.p.rapidapi.com';
  const mockIsin = 'US0378331005';

  beforeEach(() => {
    // Mock environment configuration
    sinon.stub(environment, 'YAHOO_FINANCE_API_KEY').value(mockApiKey);
    sinon.stub(environment, 'YAHOO_FINANCE_API_HOST').value(mockApiHost);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Service Initialization', () => {
    it('should create service instance with API key', () => {
      expect(() => getYahooFinanceService()).to.not.throw();
    });

    it('should throw error if API key is not configured', () => {
      sinon.stub(environment, 'YAHOO_FINANCE_API_KEY').value('');
      expect(() => getYahooFinanceService()).to.throw('Yahoo Finance API key is not configured');
    });
  });

  describe('getRealTimeQuote', () => {
    const mockApiResponse = {
      data: {
        price: {
          regularMarketPrice: { raw: 150.50 },
          currency: 'USD',
          exchange: 'NASDAQ',
          regularMarketVolume: { raw: 1000000 },
          regularMarketTime: 1625097600000
        }
      }
    };

    const expectedQuote: YahooFinanceQuote = {
      price: 150.50,
      currency: 'USD',
      exchange: 'NASDAQ',
      volume: 1000000,
      timestamp: 1625097600000
    };

    it('should return real-time quote data', async () => {
      const axiosStub = sinon.stub(axios, 'get').resolves(mockApiResponse);

      const service = getYahooFinanceService();
      const result = await service.getRealTimeQuote(mockIsin);

      expect(result).to.deep.equal(expectedQuote);
      sinon.assert.calledWith(axiosStub, 'https://yh-finance.p.rapidapi.com/stock/v2/get-quote', {
        params: { symbol: mockIsin },
        headers: {
          'X-RapidAPI-Key': mockApiKey,
          'X-RapidAPI-Host': mockApiHost
        }
      });
    });

    it('should handle API errors', async () => {
      sinon.stub(axios, 'get').rejects(new Error('API Error'));

      const service = getYahooFinanceService();
      try {
        await service.getRealTimeQuote(mockIsin);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const serviceError = error as ServiceError;
        expect(serviceError.message).to.equal('Failed to fetch data from Yahoo Finance');
      }
    });
  });

  describe('getHistoricalQuotes', () => {
    const mockApiResponse = {
      data: {
        prices: [
          {
            date: 1625097600,
            open: 150.00,
            high: 152.00,
            low: 149.00,
            close: 151.00,
            volume: 1000000,
            adjClose: 151.00
          }
        ]
      }
    };

    const expectedQuotes: HistoricalQuote[] = [
      {
        date: new Date(1625097600000),
        open: 150.00,
        high: 152.00,
        low: 149.00,
        close: 151.00,
        volume: 1000000,
        adjClose: 151.00
      }
    ];

    it('should return historical quote data', async () => {
      const axiosStub = sinon.stub(axios, 'get').resolves(mockApiResponse);

      const service = getYahooFinanceService();
      const result = await service.getHistoricalQuotes(mockIsin, {
        interval: '1d',
        range: '1mo'
      });

      expect(result).to.deep.equal(expectedQuotes);
      sinon.assert.calledWith(axiosStub, 'https://yh-finance.p.rapidapi.com/stock/v3/get-historical-data', {
        params: {
          symbol: mockIsin,
          interval: '1d',
          range: '1mo'
        },
        headers: {
          'X-RapidAPI-Key': mockApiKey,
          'X-RapidAPI-Host': mockApiHost
        }
      });
    });
  });

  describe('getIntradayQuotes', () => {
    const mockApiResponse = {
      data: {
        chart: {
          result: [{
            timestamp: [1625097600],
            indicators: {
              quote: [{
                close: [150.50],
                volume: [1000000],
                open: [150.00],
                high: [152.00],
                low: [149.00]
              }]
            }
          }]
        }
      }
    };

    const expectedQuotes: IntradayQuote[] = [
      {
        price: 150.50,
        timestamp: 1625097600000,
        volume: 1000000,
        open: 150.00,
        high: 152.00,
        low: 149.00,
        close: 150.50
      }
    ];

    it('should return intraday quote data', async () => {
      const axiosStub = sinon.stub(axios, 'get').resolves(mockApiResponse);

      const service = getYahooFinanceService();
      const result = await service.getIntradayQuotes(mockIsin);

      expect(result).to.deep.equal(expectedQuotes);
      sinon.assert.calledWith(axiosStub, 'https://yh-finance.p.rapidapi.com/stock/v2/get-chart', {
        params: {
          symbol: mockIsin,
          interval: '5m',
          range: '1d'
        },
        headers: {
          'X-RapidAPI-Key': mockApiKey,
          'X-RapidAPI-Host': mockApiHost
        }
      });
    });
  });

  describe('searchStocks', () => {
    const mockApiResponse = {
      data: {
        quotes: [
          {
            symbol: 'AAPL',
            longname: 'Apple Inc.',
            shortname: 'Apple',
            exchange: 'NASDAQ',
            quoteType: 'EQUITY'
          }
        ]
      }
    };

    const expectedResults: YahooFinanceSearchResult[] = [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'NASDAQ',
        type: 'EQUITY'
      }
    ];

    it('should return search results', async () => {
      const axiosStub = sinon.stub(axios, 'get').resolves(mockApiResponse);

      const service = getYahooFinanceService();
      const result = await service.searchStocks('Apple');

      expect(result).to.deep.equal(expectedResults);
      sinon.assert.calledWith(axiosStub, 'https://yh-finance.p.rapidapi.com/stock/v1/search', {
        params: { q: 'Apple' },
        headers: {
          'X-RapidAPI-Key': mockApiKey,
          'X-RapidAPI-Host': mockApiHost
        }
      });
    });

    it('should handle missing longname in search results', async () => {
      const responseWithoutLongname = {
        data: {
          quotes: [
            {
              symbol: 'AAPL',
              shortname: 'Apple',
              exchange: 'NASDAQ',
              quoteType: 'EQUITY'
            }
          ]
        }
      };

      sinon.stub(axios, 'get').resolves(responseWithoutLongname);

      const service = getYahooFinanceService();
      const result = await service.searchStocks('Apple');

      expect(result[0].name).to.equal('Apple');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      sinon.stub(axios, 'get').rejects(new Error('Network Error'));

      const service = getYahooFinanceService();
      try {
        await service.getRealTimeQuote(mockIsin);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const serviceError = error as ServiceError;
        expect(serviceError.message).to.equal('Failed to fetch data from Yahoo Finance');
      }
    });

    it('should handle malformed API responses', async () => {
      sinon.stub(axios, 'get').resolves({ data: {} });

      const service = getYahooFinanceService();
      try {
        await service.getRealTimeQuote(mockIsin);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const serviceError = error as ServiceError;
        expect(serviceError).to.be.an('error');
      }
    });

    it('should handle rate limiting errors', async () => {
      sinon.stub(axios, 'get').rejects({
        response: {
          status: 429,
          data: { message: 'Rate limit exceeded' }
        }
      });

      const service = getYahooFinanceService();
      try {
        await service.getRealTimeQuote(mockIsin);
        expect.fail('Should have thrown an error');
      } catch (error) {
        const serviceError = error as ServiceError;
        expect(serviceError.message).to.equal('Failed to fetch data from Yahoo Finance');
      }
    });
  });
});
