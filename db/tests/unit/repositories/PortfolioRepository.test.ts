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
      USERS_ID: 'test-user-id',
      NAME: 'John',
      SURNAME: 'Doe',
      EMAIL: 'john.doe@example.com',
      NICKNAME: 'johnd',
      PASSWORD: 'hashedPassword',
      JOIN_DATE: new Date('2024-01-01'),
    };
    await userRepository.create(testUser);
  });

  describe('create', () => {
    it('should create a new portfolio', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        PORTFOLIOS_ID: 'test-portfolio-id',
        NAME: 'Test Portfolio',
        CREATED_AT: new Date(),
        USERS_ID: testUser.USERS_ID,
      };

      // Act
      const result = await portfolioRepository.create(portfolioData);

      // Assert
      expect(result).toBeDefined();
      expect(result.PORTFOLIOS_ID).toBe(portfolioData.PORTFOLIOS_ID);
      expect(result.NAME).toBe(portfolioData.NAME);
      expect(result.USERS_ID).toBe(portfolioData.USERS_ID);

      // Verify the portfolio was actually saved
      const savedPortfolio = await prisma.portfolio.findUnique({
        where: { PORTFOLIOS_ID: portfolioData.PORTFOLIOS_ID }
      });
      expect(savedPortfolio).toBeDefined();
      expect(savedPortfolio?.NAME).toBe(portfolioData.NAME);
    });

    it('should throw an error if user does not exist', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        PORTFOLIOS_ID: 'test-portfolio-id',
        NAME: 'Test Portfolio',
        CREATED_AT: new Date(),
        USERS_ID: 'non-existent-user-id',
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
        PORTFOLIOS_ID: 'test-portfolio-id',
        NAME: 'Test Portfolio',
        CREATED_AT: new Date(),
        USERS_ID: testUser.USERS_ID,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Act
      const result = await portfolioRepository.findById(portfolioData.PORTFOLIOS_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result?.PORTFOLIOS_ID).toBe(portfolioData.PORTFOLIOS_ID);
      expect(result?.NAME).toBe(portfolioData.NAME);
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
        PORTFOLIOS_ID: 'test-portfolio-id-1',
        NAME: 'Test Portfolio 1',
        CREATED_AT: new Date(),
        USERS_ID: testUser.USERS_ID,
      };
      const portfolioData2: Portfolio = {
        PORTFOLIOS_ID: 'test-portfolio-id-2',
        NAME: 'Test Portfolio 2',
        CREATED_AT: new Date(),
        USERS_ID: testUser.USERS_ID,
      };
      await prisma.portfolio.create({ data: portfolioData1 });
      await prisma.portfolio.create({ data: portfolioData2 });

      // Act
      const result = await portfolioRepository.findByUserId(testUser.USERS_ID);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({ PORTFOLIOS_ID: portfolioData1.PORTFOLIOS_ID }),
        expect.objectContaining({ PORTFOLIOS_ID: portfolioData2.PORTFOLIOS_ID })
      ]));
    });

    it('should return empty array if user has no portfolios', async () => {
      // Act
      const result = await portfolioRepository.findByUserId(testUser.USERS_ID);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a portfolio', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        PORTFOLIOS_ID: 'test-portfolio-id',
        NAME: 'Test Portfolio',
        CREATED_AT: new Date(),
        USERS_ID: testUser.USERS_ID,
      };
      await prisma.portfolio.create({ data: portfolioData });

      const updateData = {
        NAME: 'Updated Portfolio Name',
      };

      // Act
      const result = await portfolioRepository.update(portfolioData.PORTFOLIOS_ID, updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.NAME).toBe(updateData.NAME);
      expect(result.USERS_ID).toBe(portfolioData.USERS_ID); // Unchanged field

      // Verify the update was persisted
      const updatedPortfolio = await prisma.portfolio.findUnique({
        where: { PORTFOLIOS_ID: portfolioData.PORTFOLIOS_ID }
      });
      expect(updatedPortfolio?.NAME).toBe(updateData.NAME);
    });

    it('should throw an error if portfolio does not exist', async () => {
      // Act & Assert
      await expect(portfolioRepository.update('non-existent-id', { NAME: 'New Name' }))
        .rejects
        .toThrow('Portfolio not found');
    });
  });

  describe('delete', () => {
    it('should delete a portfolio', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        PORTFOLIOS_ID: 'test-portfolio-id',
        NAME: 'Test Portfolio',
        CREATED_AT: new Date(),
        USERS_ID: testUser.USERS_ID,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Act
      const result = await portfolioRepository.delete(portfolioData.PORTFOLIOS_ID);

      // Assert
      expect(result).toBeDefined();
      expect(result.PORTFOLIOS_ID).toBe(portfolioData.PORTFOLIOS_ID);

      // Verify the portfolio was actually deleted
      const deletedPortfolio = await prisma.portfolio.findUnique({
        where: { PORTFOLIOS_ID: portfolioData.PORTFOLIOS_ID }
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
