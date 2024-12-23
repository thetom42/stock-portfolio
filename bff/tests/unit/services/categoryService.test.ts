import { expect } from 'chai';
import sinon from 'sinon';
import { categoryService, setCategoryRepository } from '../../../src/services/categoryService';
import { Category } from '../../../src/models/Category';
import { setupMockCategoryRepo, resetAllMocks } from '../../helpers/mockRepositories';

describe('CategoryService', () => {
  let mockRepo: any;

  beforeEach(() => {
    const setup = setupMockCategoryRepo();
    mockRepo = setup.mockRepo;
    // Inject mock repository into the singleton instance
    setCategoryRepository(mockRepo);
  });

  afterEach(() => {
    resetAllMocks();
    sinon.restore();
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const mockDBCategories = [
        {
          category_id: '1',
          name: 'Technology',
          created_at: new Date()
        },
        {
          category_id: '2',
          name: 'Healthcare',
          created_at: new Date()
        }
      ];

      mockRepo.findAll.resolves(mockDBCategories);

      const result = await categoryService.getAllCategories();

      expect(result).to.be.an('array').with.lengthOf(2);
      expect(result[0]).to.deep.include({
        id: '1',
        name: 'Technology'
      });
      expect(result[1]).to.deep.include({
        id: '2',
        name: 'Healthcare'
      });
      expect(mockRepo.findAll.calledOnce).to.be.true;
    });

    it('should return empty array if no categories exist', async () => {
      mockRepo.findAll.resolves([]);

      const result = await categoryService.getAllCategories();

      expect(result).to.be.an('array').that.is.empty;
      expect(mockRepo.findAll.calledOnce).to.be.true;
    });

    it('should handle errors gracefully', async () => {
      mockRepo.findAll.rejects(new Error('Database error'));

      await expect(categoryService.getAllCategories())
        .to.be.rejectedWith('Failed to fetch categories');
    });
  });

  describe('getCategoryById', () => {
    it('should return category if found', async () => {
      const mockDBCategory = {
        category_id: '1',
        name: 'Technology',
        created_at: new Date()
      };

      mockRepo.findById.resolves(mockDBCategory);

      const result = await categoryService.getCategoryById('1');

      expect(result).to.deep.include({
        id: '1',
        name: 'Technology'
      });
      expect(mockRepo.findById.calledWith('1')).to.be.true;
    });

    it('should return null if category not found', async () => {
      mockRepo.findById.resolves(null);

      const result = await categoryService.getCategoryById('999');

      expect(result).to.be.null;
      expect(mockRepo.findById.calledWith('999')).to.be.true;
    });

    it('should handle errors gracefully', async () => {
      mockRepo.findById.rejects(new Error('Database error'));

      await expect(categoryService.getCategoryById('1'))
        .to.be.rejectedWith('Failed to fetch category');
    });
  });

  describe('createCategory', () => {
    const createData = {
      name: 'New Category'
    };

    it('should create category successfully', async () => {
      const mockDBCategory = {
        category_id: '1',
        name: createData.name,
        created_at: new Date()
      };

      mockRepo.create.resolves(mockDBCategory);

      const result = await categoryService.createCategory(createData);

      expect(result).to.deep.include({
        id: '1',
        name: createData.name
      });
      expect(mockRepo.create.firstCall.args[0]).to.deep.include({
        name: createData.name
      });
    });

    it('should handle errors gracefully', async () => {
      mockRepo.create.rejects(new Error('Database error'));

      await expect(categoryService.createCategory(createData))
        .to.be.rejectedWith('Failed to create category');
    });
  });

  describe('updateCategory', () => {
    const updateData = {
      name: 'Updated Category'
    };

    it('should update category successfully', async () => {
      const mockDBCategory = {
        category_id: '1',
        name: updateData.name,
        created_at: new Date()
      };

      mockRepo.update.resolves(mockDBCategory);

      const result = await categoryService.updateCategory('1', updateData);

      expect(result).to.deep.include({
        id: '1',
        name: updateData.name
      });
      expect(mockRepo.update.firstCall.args).to.deep.equal([
        '1',
        { name: updateData.name }
      ]);
    });

    it('should return null if category not found', async () => {
      mockRepo.update.resolves(null);

      const result = await categoryService.updateCategory('999', updateData);

      expect(result).to.be.null;
      expect(mockRepo.update.firstCall.args).to.deep.equal([
        '999',
        { name: updateData.name }
      ]);
    });

    it('should handle errors gracefully', async () => {
      mockRepo.update.rejects(new Error('Database error'));

      await expect(categoryService.updateCategory('1', updateData))
        .to.be.rejectedWith('Failed to update category');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      const mockDBCategory = {
        category_id: '1',
        name: 'Technology',
        created_at: new Date()
      };

      mockRepo.delete.resolves(mockDBCategory);

      const result = await categoryService.deleteCategory('1');

      expect(result).to.deep.include({
        id: '1',
        name: 'Technology'
      });
      expect(mockRepo.delete.calledWith('1')).to.be.true;
    });

    it('should handle errors gracefully', async () => {
      mockRepo.delete.rejects(new Error('Database error'));

      await expect(categoryService.deleteCategory('1'))
        .to.be.rejectedWith('Failed to delete category');
    });
  });
});
