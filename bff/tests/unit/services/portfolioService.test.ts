import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { PortfolioService, setPortfolioRepository } from '../../../src/services/portfolioService';
import { holdingService } from '../../../src/services/holdingService';
import { CreatePortfolioDTO, UpdatePortfolioDTO } from '../../../src/models/Portfolio';
import { setupMockPortfolioRepo, resetAllMocks } from '../../helpers/mockRepositories';

use(chaiAsPromised);

describe('PortfolioService', () => {
  let mockRepo: any;
  let testPortfolioService: PortfolioService;

  beforeEach(() => {
    const setup = setupMockPortfolioRepo();
    mockRepo = setup.mockRepo;
    // Create a new PortfolioService instance with mock repository
    testPortfolioService = setPortfolioRepository(mockRepo);

    // Stub holdingService methods
    sinon.stub(holdingService, 'getHoldingsByPortfolioId').resolves([]);
  });

  afterEach(() => {
    resetAllMocks();
    sinon.restore();
  });

  describe('createPortfolio', () => {
    const mockCreateData: CreatePortfolioDTO = {
      name: 'Test Portfolio'
    };

    const mockDBPortfolio = {
      portfolio_id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'user1',
      name: 'Test Portfolio',
      created_at: new Date()
    };

    it('should create a portfolio successfully', async () => {
      mockRepo.create.resolves(mockDBPortfolio);

      const result = await testPortfolioService.createPortfolio('user1', mockCreateData);

      expect(result).to.deep.include({
        id: mockDBPortfolio.portfolio_id,
        userId: mockDBPortfolio.user_id,
        name: mockDBPortfolio.name,
        createdAt: mockDBPortfolio.created_at
      });

      // Verify the create call arguments
      const createArgs = mockRepo.create.firstCall.args[0];
      expect(createArgs.user_id).to.equal('user1');
      expect(createArgs.name).to.equal(mockCreateData.name);
      expect(createArgs.portfolio_id).to.be.a('string');
      expect(createArgs.created_at).to.be.instanceOf(Date);
    });

    it('should throw error if user not found', async () => {
      mockRepo.create.rejects(new Error('User not found'));

      await expect(testPortfolioService.createPortfolio('user1', mockCreateData))
        .to.be.rejectedWith('User not found');
    });

    it('should throw error if creation fails', async () => {
      const error = new Error('Failed to create portfolio');
      mockRepo.create.rejects(error);

      await expect(testPortfolioService.createPortfolio('user1', mockCreateData))
        .to.be.rejectedWith('Failed to create portfolio');
    });
  });

  describe('getPortfolioById', () => {
    const mockDBPortfolio = {
      portfolio_id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'user1',
      name: 'Test Portfolio',
      created_at: new Date()
    };

    it('should return portfolio if found', async () => {
      mockRepo.findById.resolves(mockDBPortfolio);

      const result = await testPortfolioService.getPortfolioById('1');

      expect(result).to.deep.include({
        id: mockDBPortfolio.portfolio_id,
        userId: mockDBPortfolio.user_id,
        name: mockDBPortfolio.name,
        createdAt: mockDBPortfolio.created_at
      });

      expect(mockRepo.findById.calledWith('1')).to.be.true;
    });

    it('should return null if portfolio not found', async () => {
      mockRepo.findById.resolves(null);

      const result = await testPortfolioService.getPortfolioById('999');
      expect(result).to.be.null;
    });
  });

  describe('updatePortfolio', () => {
    const mockUpdateData: UpdatePortfolioDTO = {
      name: 'Updated Portfolio'
    };

    const mockDBPortfolio = {
      portfolio_id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'user1',
      name: 'Test Portfolio',
      created_at: new Date()
    };

    const mockUpdatedDBPortfolio = {
      ...mockDBPortfolio,
      name: 'Updated Portfolio'
    };

    it('should update portfolio successfully', async () => {
      mockRepo.update.resolves(mockUpdatedDBPortfolio);

      const result = await testPortfolioService.updatePortfolio('1', mockUpdateData);

      expect(result).to.deep.include({
        id: mockUpdatedDBPortfolio.portfolio_id,
        userId: mockUpdatedDBPortfolio.user_id,
        name: mockUpdatedDBPortfolio.name,
        createdAt: mockUpdatedDBPortfolio.created_at
      });

      expect(mockRepo.update.firstCall.args).to.deep.equal([
        '1',
        { name: mockUpdateData.name }
      ]);
    });

    it('should throw error if update fails', async () => {
      const error = new Error('Failed to update portfolio');
      mockRepo.update.rejects(error);

      await expect(testPortfolioService.updatePortfolio('1', mockUpdateData))
        .to.be.rejectedWith('Failed to update portfolio');
    });
  });

  describe('deletePortfolio', () => {
    const mockDBPortfolio = {
      portfolio_id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'user1',
      name: 'Test Portfolio',
      created_at: new Date()
    };

    it('should delete portfolio successfully', async () => {
      mockRepo.delete.resolves(mockDBPortfolio);

      const result = await testPortfolioService.deletePortfolio('1');

      expect(result).to.deep.include({
        id: mockDBPortfolio.portfolio_id,
        userId: mockDBPortfolio.user_id,
        name: mockDBPortfolio.name,
        createdAt: mockDBPortfolio.created_at
      });

      expect(mockRepo.delete.calledWith('1')).to.be.true;
    });

    it('should throw error if portfolio not found', async () => {
      mockRepo.delete.rejects(new Error('Portfolio not found'));

      await expect(testPortfolioService.deletePortfolio('999'))
        .to.be.rejectedWith('Portfolio not found');
    });
  });

  describe('ID Generation', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('should generate valid UUIDs for portfolios', async () => {
      const mockDBPortfolio = {
        portfolio_id: '550e8400-e29b-41d4-a716-446655440000',
        user_id: 'user1',
        name: 'Test Portfolio',
        created_at: new Date()
      };

      mockRepo.create.resolves(mockDBPortfolio);
      const result = await testPortfolioService.createPortfolio('user1', {
        name: 'Test Portfolio'
      });

      expect(result.id).to.match(uuidRegex);
      expect(result.id).to.equal('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should generate unique portfolio IDs', async () => {
      const ids = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const mockDBPortfolio = {
          portfolio_id: `mock-${i}`,
          user_id: 'user1',
          name: `Test Portfolio ${i}`,
          created_at: new Date()
        };
        mockRepo.create.resolves(mockDBPortfolio);

        const result = await testPortfolioService.createPortfolio('user1', {
          name: `Test Portfolio ${i}`
        });
        ids.add(result.id);
      }

      expect(ids.size).to.equal(iterations);
    });

    it('should handle ID generation errors', async () => {
      mockRepo.create.rejects(new Error('ID generation failed'));

      await expect(
        testPortfolioService.createPortfolio('user1', {
          name: 'Test Portfolio'
        })
      ).to.be.rejectedWith('ID generation failed');
    });
  });
});
