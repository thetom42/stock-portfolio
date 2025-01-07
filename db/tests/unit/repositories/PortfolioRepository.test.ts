import { PrismaClient } from '@prisma/client';
import { PortfolioRepository } from '../../../src/repositories/PortfolioRepository';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { CategoryRepository } from '../../../src/repositories/CategoryRepository';
import { StockRepository } from '../../../src/repositories/StockRepository';
import { Portfolio } from '../../../src/models/Portfolio';
import { User } from '../../../src/models/User';
import { Category } from '../../../src/models/Category';
import { Stock } from '../../../src/models/Stock';
import { getPrismaClient, clearDatabase } from '../../helpers/prisma';

describe('PortfolioRepository', () => {
  let portfolioRepository: PortfolioRepository;
  let userRepository: UserRepository;
  let categoryRepository: CategoryRepository;
  let stockRepository: StockRepository;
  let prisma: PrismaClient;
  let testUser: User;
  let testCategory: Category;
  let testStock: Stock;

  beforeEach(async () => {
    prisma = getPrismaClient();
    portfolioRepository = new PortfolioRepository(prisma);
    userRepository = new UserRepository(prisma);
    categoryRepository = new CategoryRepository(prisma);
    stockRepository = new StockRepository(prisma);
    await clearDatabase();

    // Create test user
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

    // Create test category
    testCategory = {
      category_id: 'test-category-id',
      name: 'Test Category'
    };
    await categoryRepository.create(testCategory);

    // Create test stock
    testStock = {
      isin: 'TEST123456789',
      category_id: testCategory.category_id,
      name: 'Test Stock',
      wkn: 'TEST123',
      symbol: 'TST'
    };
    await stockRepository.create(testStock);
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

    it('should throw an error if portfolio already exists', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await portfolioRepository.create(portfolioData);

      // Act & Assert
      await expect(portfolioRepository.create(portfolioData))
        .rejects
        .toThrow('Portfolio already exists');
    });

    it('should handle unexpected errors during creation', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };

      // Mock prisma create to throw an unexpected error
      jest.spyOn(prisma.portfolio, 'create').mockRejectedValueOnce(new Error('Unexpected error'));

      // Act & Assert
      await expect(portfolioRepository.create(portfolioData))
        .rejects
        .toThrow('Unexpected error');
    });

    it('should handle non-Error objects during creation', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };

      // Mock prisma create to throw a non-Error object
      jest.spyOn(prisma.portfolio, 'create').mockRejectedValueOnce('Some string error');

      // Act & Assert
      await expect(portfolioRepository.create(portfolioData))
        .rejects
        .toBe('Some string error');
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

    it('should handle unexpected errors during findById', async () => {
      // Mock prisma findUnique to throw an unexpected error
      jest.spyOn(prisma.portfolio, 'findUnique').mockRejectedValueOnce(new Error('Unexpected error'));

      // Act & Assert
      await expect(portfolioRepository.findById('test-id'))
        .rejects
        .toThrow('Unexpected error');
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

    it('should return portfolios ordered by name', async () => {
      // Arrange
      const portfolios = [
        {
          portfolio_id: 'id-3',
          name: 'Portfolio C',
          created_at: new Date(),
          user_id: testUser.user_id,
        },
        {
          portfolio_id: 'id-1',
          name: 'Portfolio A',
          created_at: new Date(),
          user_id: testUser.user_id,
        },
        {
          portfolio_id: 'id-2',
          name: 'Portfolio B',
          created_at: new Date(),
          user_id: testUser.user_id,
        }
      ];
      await Promise.all(portfolios.map(portfolio =>
        prisma.portfolio.create({ data: portfolio })
      ));

      // Act
      const result = await portfolioRepository.findByUserId(testUser.user_id);

      // Assert
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Portfolio A');
      expect(result[1].name).toBe('Portfolio B');
      expect(result[2].name).toBe('Portfolio C');
    });

    it('should handle unexpected errors during findByUserId', async () => {
      // Mock prisma findMany to throw an unexpected error
      jest.spyOn(prisma.portfolio, 'findMany').mockRejectedValueOnce(new Error('Unexpected error'));

      // Act & Assert
      await expect(portfolioRepository.findByUserId(testUser.user_id))
        .rejects
        .toThrow('Unexpected error');
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

    it('should throw an error if updated user does not exist', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Act & Assert
      await expect(portfolioRepository.update(portfolioData.portfolio_id, { user_id: 'non-existent-user' }))
        .rejects
        .toThrow('User not found');
    });

    it('should handle unexpected errors during update', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Mock prisma update to throw an unexpected error
      jest.spyOn(prisma.portfolio, 'update').mockRejectedValueOnce(new Error('Unexpected error'));

      // Act & Assert
      await expect(portfolioRepository.update(portfolioData.portfolio_id, { name: 'New Name' }))
        .rejects
        .toThrow('Unexpected error');
    });

    it('should handle non-Error objects during update', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Mock prisma update to throw a non-Error object
      jest.spyOn(prisma.portfolio, 'update').mockRejectedValueOnce('Some string error');

      // Act & Assert
      await expect(portfolioRepository.update(portfolioData.portfolio_id, { name: 'New Name' }))
        .rejects
        .toBe('Some string error');
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

    it('should throw an error if portfolio has associated holdings', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Create an associated holding
      await prisma.holding.create({
        data: {
          holding_id: 'test-holding-id',
          portfolio_id: portfolioData.portfolio_id,
          isin: testStock.isin,
          quantity: 100,
          start_date: new Date(),
          end_date: null
        }
      });

      // Act & Assert
      await expect(portfolioRepository.delete(portfolioData.portfolio_id))
        .rejects
        .toThrow('Cannot delete portfolio with associated holdings');
    });

    it('should handle unexpected errors during deletion', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Mock prisma delete to throw an unexpected error
      jest.spyOn(prisma.portfolio, 'delete').mockRejectedValueOnce(new Error('Unexpected error'));

      // Act & Assert
      await expect(portfolioRepository.delete(portfolioData.portfolio_id))
        .rejects
        .toThrow('Unexpected error');
    });

    it('should handle non-Error objects during deletion', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Mock prisma delete to throw a non-Error object
      jest.spyOn(prisma.portfolio, 'delete').mockRejectedValueOnce('Some string error');

      // Act & Assert
      await expect(portfolioRepository.delete(portfolioData.portfolio_id))
        .rejects
        .toBe('Some string error');
    });

    it('should handle non-Error objects during holdings check', async () => {
      // Arrange
      const portfolioData: Portfolio = {
        portfolio_id: 'test-portfolio-id',
        name: 'Test Portfolio',
        created_at: new Date(),
        user_id: testUser.user_id,
      };
      await prisma.portfolio.create({ data: portfolioData });

      // Mock prisma findMany to throw a non-Error object
      jest.spyOn(prisma.holding, 'findMany').mockRejectedValueOnce('Some string error');

      // Act & Assert
      await expect(portfolioRepository.delete(portfolioData.portfolio_id))
        .rejects
        .toBe('Some string error');
    });
  });
});
