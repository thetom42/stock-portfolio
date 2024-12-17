import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import * as categoryService from '../../../src/services/categoryService';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../../../src/models/Category';
import { mockCategoryRepo } from '../../helpers/mockRepositories';

use(chaiAsPromised);

describe('CategoryService', () => {
  beforeEach(() => {
    // Set up mock repository
    categoryService.setCategoryRepository(mockCategoryRepo);
  });

  afterEach(() => {
    // Reset all stubs
    sinon.restore();
  });

  describe('createCategory', () => {
    const mockCreateData: CreateCategoryDTO = {
      name: 'Test Category'
    };

    // DB layer response uses old naming
    const mockDBCategory = {
      category_id: '1',
      name: 'Test Category'
    };

    // BFF layer response uses new naming
    const expectedBFFCategory = {
      id: '1',
      name: 'Test Category'
    };

    it('should create a category successfully', async () => {
      mockCategoryRepo.create.resolves(mockDBCategory);

      const result = await categoryService.createCategory(mockCreateData);

      expect(result).to.deep.equal(expectedBFFCategory);
      expect(mockCategoryRepo.create.firstCall.args[0]).to.deep.include({
        category_id: '',
        name: mockCreateData.name
      });
    });

    it('should throw error if category name already exists', async () => {
      mockCategoryRepo.create.rejects(new Error('Category with this name already exists'));

      await expect(categoryService.createCategory(mockCreateData))
        .to.be.rejectedWith('Category with this name already exists');
    });
  });

  describe('getCategoryById', () => {
    // DB layer response uses old naming
    const mockDBCategory = {
      category_id: '1',
      name: 'Test Category'
    };

    // BFF layer response uses new naming
    const expectedBFFCategory = {
      id: '1',
      name: 'Test Category'
    };

    it('should return category if found', async () => {
      mockCategoryRepo.findById.resolves(mockDBCategory);

      const result = await categoryService.getCategoryById('1');

      expect(result).to.deep.equal(expectedBFFCategory);
      expect(mockCategoryRepo.findById.calledWith('1')).to.be.true;
    });

    it('should return null if category not found', async () => {
      mockCategoryRepo.findById.resolves(null);

      const result = await categoryService.getCategoryById('999');
      expect(result).to.be.null;
      expect(mockCategoryRepo.findById.calledWith('999')).to.be.true;
    });
  });

  describe('getAllCategories', () => {
    // DB layer response uses old naming
    const mockDBCategories = [
      { category_id: '1', name: 'Category 1' },
      { category_id: '2', name: 'Category 2' }
    ];

    // BFF layer response uses new naming
    const expectedBFFCategories = [
      { id: '1', name: 'Category 1' },
      { id: '2', name: 'Category 2' }
    ];

    it('should return all categories', async () => {
      mockCategoryRepo.findAll.resolves(mockDBCategories);

      const result = await categoryService.getAllCategories();

      expect(result).to.deep.equal(expectedBFFCategories);
      expect(mockCategoryRepo.findAll.called).to.be.true;
    });

    it('should return empty array if no categories exist', async () => {
      mockCategoryRepo.findAll.resolves([]);

      const result = await categoryService.getAllCategories();
      expect(result).to.deep.equal([]);
      expect(mockCategoryRepo.findAll.called).to.be.true;
    });
  });

  describe('updateCategory', () => {
    const mockUpdateData: UpdateCategoryDTO = {
      name: 'Updated Category'
    };

    // DB layer response uses old naming
    const mockDBUpdatedCategory = {
      category_id: '1',
      name: 'Updated Category'
    };

    // BFF layer response uses new naming
    const expectedBFFUpdatedCategory = {
      id: '1',
      name: 'Updated Category'
    };

    it('should update category successfully', async () => {
      mockCategoryRepo.update.resolves(mockDBUpdatedCategory);

      const result = await categoryService.updateCategory('1', mockUpdateData);

      expect(result).to.deep.equal(expectedBFFUpdatedCategory);
      expect(mockCategoryRepo.update.firstCall.args).to.deep.equal([
        '1',
        { name: mockUpdateData.name }
      ]);
    });

    it('should throw error if category not found', async () => {
      mockCategoryRepo.update.rejects(new Error('Category not found'));

      await expect(categoryService.updateCategory('999', mockUpdateData))
        .to.be.rejectedWith('Category not found');
    });

    it('should throw error if new name already exists', async () => {
      mockCategoryRepo.update.rejects(new Error('Category with this name already exists'));

      await expect(categoryService.updateCategory('1', mockUpdateData))
        .to.be.rejectedWith('Category with this name already exists');
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      mockCategoryRepo.delete.resolves();

      await categoryService.deleteCategory('1');

      expect(mockCategoryRepo.delete.calledWith('1')).to.be.true;
    });

    it('should throw error if category not found', async () => {
      mockCategoryRepo.delete.rejects(new Error('Category not found'));

      await expect(categoryService.deleteCategory('999'))
        .to.be.rejectedWith('Category not found');
    });

    it('should throw error if deletion fails', async () => {
      mockCategoryRepo.delete.rejects(new Error('Database error'));

      await expect(categoryService.deleteCategory('1'))
        .to.be.rejectedWith('Failed to delete category');
    });
  });
});
