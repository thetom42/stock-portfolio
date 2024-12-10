import { PrismaClient } from '@prisma/client';
import { PortfolioRepository } from '../../../repositories/PortfolioRepository';
import { UserRepository } from '../../../repositories/UserRepository';
import { Portfolio } from '../../../models/Portfolio';
import { User } from '../../../models/User';
import { getPrismaClient, clearDatabase } from '../../helpers/prisma';

describe('PortfolioRepository', () => {
  let portfolioRepository: PortfolioRepository;
  let userRepository: UserRepository;
  let prisma: PrismaClient;
  let testUser: User;

  beforeEach(async () => {
    prisma = getPrismaClient();
    portfolioRepository = new PortfolioRepository(prisma);
    userRepository = new UserRepository(prisma);
    await clearDatabase();

    // Create a test user
    testUser = {
      user_id: 'test-user-id',
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
      nickname: 'johnd',
      password: 'hashedPassword',
      join_date: new Date('2024-01-01'),
    };
    await userRepository.create(testUser);
  });

  describe('create', () => {
    it('should create a new portfolio', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };

      // Act
      const result = await portfolioRepository.create(portfolioData);

      // Assert
      expect(result).toBeDefined();
      expect(result.portfolio_id).toBe(portfolioData.portfolio_id);
      expect(result.name).toBe(portfolioData.name);
      expect(result.user_id).toBe(portfolioData.user_id);

      // Verify the portfolio was actually saved
      const savedPortfolio = await prisma.portfolio.findUnique({
        where: { portfolio_id: portfolioData.portfolio_id }
      });
      expect(savedPortfolio).toBeDefined();
      expect(savedPortfolio?.name).toBe(portfolioData.name);
    });

    it('should throw an error if user does not exist', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: 'non-existent-user-id',
      };

      // Act & Assert
      await expect(portfolioRepository.create(portfolioData))
        .rejects
        .toThrow('User not found');
    });
  });

  describe('findById', () => {
    it('should find a portfolio by ID', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Act
      const result = await portfolioRepository.findById(portfolioData.portfolio_id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.portfolio_id).toBe(portfolioData.portfolio_id);
      expect(result?.name).toBe(portfolioData.name);
    });

    it('should return null if portfolio is not found', async () => {
      // Act
      const result = await portfolioRepository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all portfolios for a user', async () => {
      // Arrange
      const portfolioData1: Portfolio = {
        portfolio_id: 'test-portfolio-id-1',
        name: 'Test Portfolio 1',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      const portfolioData2: Portfolio = {
        portfolio_id: 'test-portfolio-id-2',
        name: 'Test Portfolio 2',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData1 });
      await prisma.portfolio.create({ data: portfolioData2 });

      // Act
      const result = await portfolioRepository.findByUserId(testUser.user_id);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ portfolio_id: portfolioData1.portfolio_id }),
        expect.objectContaining({ portfolio_id: portfolioData2.portfolio_id })
      ]));
    });

    it('should return empty array if user has no portfolios', async () => {
      // Act
      const result = await portfolioRepository.findByUserId(testUser.user_id);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a portfolio', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData });

      const updateData = {
        name: 'Updated Portfolio Name',
      };

      // Act
      const result = await portfolioRepository.update(portfolioData.portfolio_id, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.user_id).toBe(portfolioData.user_id); // Unchanged field

      // Verify the update was persisted
      const updatedPortfolio = await prisma.portfolio.findUnique({
        where: { portfolio_id: portfolioData.portfolio_id }
      });
      expect(updatedPortfolio?.name).toBe(updateData.name);
    });

    it('should throw an error if portfolio does not exist', async () => {
      // Act & Assert
      await expect(portfolioRepository.update('non-existent-id', { name: 'New Name' }))
        .rejects
        .toThrow('Portfolio not found');
    });
  });

  describe('delete', () => {
    it('should delete a portfolio', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Act
      const result = await portfolioRepository.delete(portfolioData.portfolio_id);

      // Assert
      expect(result).toBeDefined();
      expect(result.portfolio_id).toBe(portfolioData.portfolio_id);

      // Verify the portfolio was actually deleted
      const deletedPortfolio = await prisma.portfolio.findUnique({
        where: { portfolio_id: portfolioData.portfolio_id }
      });
      expect(deletedPortfolio).toBeNull();
    });

    it('should throw an error if portfolio does not exist', async () => {
      // Act & Assert
      await expect(portfolioRepository.delete('non-existent-id'))
        .rejects
        .toThrow('Portfolio not found');
    });
  });
});
