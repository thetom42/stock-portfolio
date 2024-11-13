import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import * as portfolioService from '../../../src/services/portfolioService';
import * as holdingService from '../../../src/services/holdingService';
import { CreatePortfolioDTO, UpdatePortfolioDTO } from '../../../src/models/Portfolio';
import { 
  mockPortfolioRepo,
  setupRepositoryMocks, 
  resetRepositoryMocks 
} from '../../helpers/mockRepositories';

use(chaiAsPromised);

describe('PortfolioService', () => {
  let holdingServiceStub: sinon.SinonStub;

  beforeEach(() => {
    setupRepositoryMocks();
    // Use the new setter method to inject the mock repository
    portfolioService.setPortfolioRepository(mockPortfolioRepo);
    
    // Stub holdingService.getHoldingsByPortfolioId
    holdingServiceStub = sinon.stub(holdingService, 'getHoldingsByPortfolioId').resolves([]);
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  describe('createPortfolio', () => {
    const mockCreateData: CreatePortfolioDTO = {
      name: 'Test Portfolio',
      description: 'Test Description'
    };

    const mockDBPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    it('should create a portfolio successfully', async () => {
      mockPortfolioRepo.create.resolves(mockDBPortfolio);

      const result = await portfolioService.createPortfolio('user1', mockCreateData);

      expect(result).to.deep.include({
        id: mockDBPortfolio.PORTFOLIOS_ID,
        userId: mockDBPortfolio.USERS_ID,
        name: mockDBPortfolio.NAME,
        description: '',
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        holdings: []
      });

      // Check dates separately since they're dynamic
      expect(result.createdAt).to.be.instanceOf(Date);
      expect(result.updatedAt).to.be.instanceOf(Date);

      expect(mockPortfolioRepo.create.firstCall.args[0]).to.deep.include({
        PORTFOLIOS_ID: '',
        USERS_ID: 'user1',
        NAME: mockCreateData.name
      });
      // Verify CREATED_AT is a Date without comparing exact values
      expect(mockPortfolioRepo.create.firstCall.args[0].CREATED_AT).to.be.instanceOf(Date);
    });

    it('should throw error if user not found', async () => {
      mockPortfolioRepo.create.rejects(new Error('User not found'));

      await expect(portfolioService.createPortfolio('user1', mockCreateData))
        .to.be.rejectedWith('User not found');
    });

    it('should throw error if creation fails', async () => {
      const error = new Error('Failed to create portfolio');
      mockPortfolioRepo.create.rejects(error);

      await expect(portfolioService.createPortfolio('user1', mockCreateData))
        .to.be.rejectedWith('Failed to create portfolio');
    });
  });

  describe('getPortfolioById', () => {
    const mockDBPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    it('should return portfolio if found', async () => {
      mockPortfolioRepo.findById.resolves(mockDBPortfolio);

      const result = await portfolioService.getPortfolioById('1');

      expect(result).to.deep.include({
        id: mockDBPortfolio.PORTFOLIOS_ID,
        userId: mockDBPortfolio.USERS_ID,
        name: mockDBPortfolio.NAME,
        description: '',
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        holdings: []
      });

      // Check dates separately
      expect(result?.createdAt).to.be.instanceOf(Date);
      expect(result?.updatedAt).to.be.instanceOf(Date);

      expect(mockPortfolioRepo.findById.calledWith('1')).to.be.true;
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.getPortfolioById('999');
      expect(result).to.be.null;
    });

    it('should calculate portfolio totals with holdings', async () => {
      mockPortfolioRepo.findById.resolves(mockDBPortfolio);
      
      const mockHoldings = [
        {
          HOLDINGS_ID: 'h1',
          ISIN: 'stock1',
          QUANTITY: 10,
          currentPrice: 100 // Mock current price
        },
        {
          HOLDINGS_ID: 'h2',
          ISIN: 'stock2',
          QUANTITY: 5,
          currentPrice: 200 // Mock current price
        }
      ];
      
      holdingServiceStub.resolves(mockHoldings);

      const result = await portfolioService.getPortfolioById('1');

      expect(result).to.deep.include({
        totalValue: 2000, // (10 * 100) + (5 * 200)
        totalGainLoss: 0, // In this test case, cost equals value
        totalGainLossPercentage: 0
      });

      expect(result?.holdings).to.have.lengthOf(2);
      expect(result?.holdings[0]).to.deep.include({
        id: 'h1',
        stockId: 'stock1',
        quantity: 10,
        currentValue: 1000
      });
    });
  });

  describe('updatePortfolio', () => {
    const mockUpdateData: UpdatePortfolioDTO = {
      name: 'Updated Portfolio',
      description: 'Updated Description'
    };

    const mockDBPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    const mockUpdatedDBPortfolio = {
      ...mockDBPortfolio,
      NAME: 'Updated Portfolio'
    };

    it('should update portfolio successfully', async () => {
      mockPortfolioRepo.findById.resolves(mockDBPortfolio);
      mockPortfolioRepo.update.resolves(mockUpdatedDBPortfolio);

      const result = await portfolioService.updatePortfolio('1', mockUpdateData);

      expect(result).to.deep.include({
        id: mockUpdatedDBPortfolio.PORTFOLIOS_ID,
        userId: mockUpdatedDBPortfolio.USERS_ID,
        name: mockUpdatedDBPortfolio.NAME,
        description: '',
        totalValue: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        holdings: []
      });

      // Check dates separately
      expect(result?.createdAt).to.be.instanceOf(Date);
      expect(result?.updatedAt).to.be.instanceOf(Date);

      expect(mockPortfolioRepo.update.firstCall.args).to.deep.equal([
        '1',
        { NAME: mockUpdateData.name }
      ]);
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.updatePortfolio('999', mockUpdateData);
      expect(result).to.be.null;
    });

    it('should throw error if update fails', async () => {
      mockPortfolioRepo.findById.resolves(mockDBPortfolio);
      const error = new Error('Failed to update portfolio');
      mockPortfolioRepo.update.rejects(error);

      await expect(portfolioService.updatePortfolio('1', mockUpdateData))
        .to.be.rejectedWith('Failed to update portfolio');
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio successfully', async () => {
      mockPortfolioRepo.delete.resolves();

      await portfolioService.deletePortfolio('1');

      expect(mockPortfolioRepo.delete.calledWith('1')).to.be.true;
    });

    it('should throw error if portfolio not found', async () => {
      mockPortfolioRepo.delete.rejects(new Error('Portfolio not found'));

      await expect(portfolioService.deletePortfolio('999'))
        .to.be.rejectedWith('Portfolio not found');
    });

    it('should throw error if deletion fails', async () => {
      mockPortfolioRepo.delete.rejects(new Error('Database error'));

      await expect(portfolioService.deletePortfolio('1'))
        .to.be.rejectedWith('Failed to delete portfolio');
    });
  });

  describe('getPortfolioSummary', () => {
    const mockDBPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    const mockHoldings = [
      {
        HOLDINGS_ID: 'h1',
        ISIN: 'AAPL',
        QUANTITY: 10,
        currentPrice: 150
      },
      {
        HOLDINGS_ID: 'h2',
        ISIN: 'MSFT',
        QUANTITY: 5,
        currentPrice: 200
      }
    ];

    it('should return portfolio summary if found', async () => {
      mockPortfolioRepo.findById.resolves(mockDBPortfolio);
      holdingServiceStub.resolves(mockHoldings);

      const result = await portfolioService.getPortfolioSummary('1');
      expect(result).to.not.be.null;
      if (result) {
        expect(result).to.have.all.keys([
          'totalValue',
          'totalGainLoss',
          'totalGainLossPercentage',
          'numberOfHoldings',
          'topPerformers'
        ]);
        expect(result.numberOfHoldings).to.equal(2);
        expect(result.topPerformers).to.be.an('array');
      }
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.getPortfolioSummary('999');
      expect(result).to.be.null;
    });
  });

  describe('getPortfolioPerformance', () => {
    const mockDBPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    it('should return portfolio performance if found', async () => {
      mockPortfolioRepo.findById.resolves(mockDBPortfolio);
      holdingServiceStub.resolves([]);

      const result = await portfolioService.getPortfolioPerformance('1');
      expect(result).to.not.be.null;
      if (result) {
        expect(result).to.have.all.keys(['daily', 'weekly', 'monthly']);
        expect(result.daily).to.be.an('array');
        expect(result.weekly).to.be.an('array');
        expect(result.monthly).to.be.an('array');
        expect(result.daily).to.have.lengthOf(7);
        expect(result.weekly).to.have.lengthOf(4);
        expect(result.monthly).to.have.lengthOf(12);
      }
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.getPortfolioPerformance('999');
      expect(result).to.be.null;
    });
  });

  describe('getPortfolioHoldings', () => {
    const mockDBPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    const mockHoldings = [
      {
        HOLDINGS_ID: 'h1',
        ISIN: 'AAPL',
        QUANTITY: 10,
        currentPrice: 150
      }
    ];

    it('should return portfolio holdings if found', async () => {
      mockPortfolioRepo.findById.resolves(mockDBPortfolio);
      holdingServiceStub.resolves(mockHoldings);

      const result = await portfolioService.getPortfolioHoldings('1');
      expect(result).to.not.be.null;
      if (result) {
        expect(result).to.be.an('array');
        expect(result[0]).to.have.all.keys([
          'id',
          'stockId',
          'quantity',
          'averageCost',
          'currentValue',
          'gainLoss',
          'gainLossPercentage'
        ]);
      }
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.getPortfolioHoldings('999');
      expect(result).to.be.null;
    });
  });

  describe('getPortfolioAllocation', () => {
    const mockDBPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    it('should return portfolio allocation if found', async () => {
      mockPortfolioRepo.findById.resolves(mockDBPortfolio);

      const result = await portfolioService.getPortfolioAllocation('1');
      expect(result).to.not.be.null;
      if (result) {
        expect(result).to.have.all.keys(['bySector', 'byAssetType']);
        expect(result.bySector).to.be.an('array');
        expect(result.byAssetType).to.be.an('array');
        
        // Check if percentages sum up to 100
        const sectorTotal = result.bySector.reduce((sum, item) => sum + item.percentage, 0);
        const assetTypeTotal = result.byAssetType.reduce((sum, item) => sum + item.percentage, 0);
        
        expect(Math.round(sectorTotal)).to.equal(100);
        expect(Math.round(assetTypeTotal)).to.equal(100);
      }
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.getPortfolioAllocation('999');
      expect(result).to.be.null;
    });
  });

  describe('getPortfolioReturns', () => {
    const mockDBPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    it('should return portfolio returns if found', async () => {
      mockPortfolioRepo.findById.resolves(mockDBPortfolio);

      const result = await portfolioService.getPortfolioReturns('1');
      expect(result).to.not.be.null;
      if (result) {
        expect(result).to.have.all.keys([
          'totalReturn',
          'totalReturnPercentage',
          'annualizedReturn',
          'periodReturns'
        ]);
        expect(result.periodReturns).to.have.all.keys([
          '1d', '1w', '1m', '3m', '6m', '1y', 'ytd'
        ]);
      }
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.getPortfolioReturns('999');
      expect(result).to.be.null;
    });
  });

  describe('getPortfolioHistory', () => {
    const mockDBPortfolio = {
      PORTFOLIOS_ID: '1',
      USERS_ID: 'user1',
      NAME: 'Test Portfolio',
      CREATED_AT: new Date()
    };

    it('should return portfolio history if found', async () => {
      mockPortfolioRepo.findById.resolves(mockDBPortfolio);

      const result = await portfolioService.getPortfolioHistory('1');
      expect(result).to.not.be.null;
      if (result) {
        expect(result).to.have.all.keys(['transactions', 'valueHistory']);
        expect(result.transactions).to.be.an('array');
        expect(result.valueHistory).to.be.an('array');
        if (result.transactions.length > 0) {
          expect(result.transactions[0]).to.have.all.keys([
            'date',
            'type',
            'symbol',
            'quantity',
            'price'
          ]);
        }
        if (result.valueHistory.length > 0) {
          expect(result.valueHistory[0]).to.have.all.keys([
            'date',
            'value'
          ]);
        }
      }
    });

    it('should return null if portfolio not found', async () => {
      mockPortfolioRepo.findById.resolves(null);

      const result = await portfolioService.getPortfolioHistory('999');
      expect(result).to.be.null;
    });
  });
});
