import 'mocha';
import { expect, use } from 'chai';
import spies from 'chai-spies';
import sinon from 'sinon';
import * as categoryService from '../../../src/services/categoryService';
import { Category, CreateCategoryDTO, UpdateCategoryDTO } from '../../../src/models/Category';
import { mockCategoryRepo, setupRepositoryMocks, resetRepositoryMocks } from '../../helpers/mockRepositories';

use(spies);

describe('CategoryService', () => {
  beforeEach(() => {
    setupRepositoryMocks();
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  describe('createCategory', () => {
    const mockCreateData: CreateCategoryDTO = {
      NAME: 'Test Category'
    };

    const mockCreatedCategory: Category = {
      CATEGORIES_ID: 'cat123',
      NAME: mockCreateData.NAME
    };

    it('should create a category successfully', async () => {
      mockCategoryRepo.findByName.resolves(null);
      mockCategoryRepo.create.resolves(mockCreatedCategory);

      const result = await categoryService.createCategory(mockCreateData);

      expect(result).to.deep.equal(mockCreatedCategory);
      expect(mockCategoryRepo.findByName).to.have.been.called.with(mockCreateData.NAME);
      expect(mockCategoryRepo.create).to.have.been.called();
    });

    it('should throw error if category name already exists', async () => {
      mockCategoryRepo.findByName.resolves(mockCreatedCategory);

      try {
        await categoryService.createCategory(mockCreateData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('Error');
        expect(error.message).to.equal('Category with this name already exists');
      }

      expect(mockCategoryRepo.create).to.not.have.been.called();
    });
  });

  describe('getCategoryById', () => {
    const mockCategory: Category = {
      CATEGORIES_ID: 'cat123',
      NAME: 'Test Category'
    };

    it('should return category if found', async () => {
      mockCategoryRepo.findById.resolves(mockCategory);

      const result = await categoryService.getCategoryById('cat123');

      expect(result).to.deep.equal(mockCategory);
      expect(mockCategoryRepo.findById).to.have.been.called.with('cat123');
    });

    it('should return null if category not found', async () => {
      mockCategoryRepo.findById.resolves(null);

      const result = await categoryService.getCategoryById('nonexistent');

      expect(result).to.be.null;
      expect(mockCategoryRepo.findById).to.have.been.called.with('nonexistent');
    });
  });

  describe('getAllCategories', () => {
    const mockCategories: Category[] = [
      { CATEGORIES_ID: 'cat1', NAME: 'Category 1' },
      { CATEGORIES_ID: 'cat2', NAME: 'Category 2' }
    ];

    it('should return all categories', async () => {
      mockCategoryRepo.findAll.resolves(mockCategories);

      const result = await categoryService.getAllCategories();

      expect(result).to.deep.equal(mockCategories);
      expect(mockCategoryRepo.findAll).to.have.been.called();
    });

    it('should return empty array if no categories exist', async () => {
      mockCategoryRepo.findAll.resolves([]);

      const result = await categoryService.getAllCategories();

      expect(result).to.deep.equal([]);
      expect(mockCategoryRepo.findAll).to.have.been.called();
    });
  });

  describe('updateCategory', () => {
    const mockCategory: Category = {
      CATEGORIES_ID: 'cat123',
      NAME: 'Test Category'
    };

    const updateData: UpdateCategoryDTO = {
      NAME: 'Updated Category'
    };

    it('should update category successfully', async () => {
      mockCategoryRepo.findById.resolves(mockCategory);
      mockCategoryRepo.findByName.resolves(null);
      mockCategoryRepo.update.resolves({ ...mockCategory, ...updateData });

      const result = await categoryService.updateCategory('cat123', updateData);

      expect(result).to.deep.equal({ ...mockCategory, ...updateData });
      expect(mockCategoryRepo.findById).to.have.been.called.with('cat123');
      expect(mockCategoryRepo.findByName).to.have.been.called.with(updateData.NAME);
      expect(mockCategoryRepo.update).to.have.been.called();
    });

    it('should throw error if category not found', async () => {
      mockCategoryRepo.findById.resolves(null);

      try {
        await categoryService.updateCategory('nonexistent', updateData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('Error');
        expect(error.message).to.equal('Category not found');
      }

      expect(mockCategoryRepo.update).to.not.have.been.called();
    });

    it('should throw error if new name already exists', async () => {
      mockCategoryRepo.findById.resolves(mockCategory);
      mockCategoryRepo.findByName.resolves({ 
        CATEGORIES_ID: 'different-id', 
        NAME: updateData.NAME 
      });

      try {
        await categoryService.updateCategory('cat123', updateData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('Error');
        expect(error.message).to.equal('Category with this name already exists');
      }

      expect(mockCategoryRepo.update).to.not.have.been.called();
    });

    it('should allow update if new name matches current category', async () => {
      mockCategoryRepo.findById.resolves(mockCategory);
      mockCategoryRepo.findByName.resolves({ ...mockCategory, NAME: updateData.NAME });
      mockCategoryRepo.update.resolves({ ...mockCategory, ...updateData });

      const result = await categoryService.updateCategory('cat123', updateData);

      expect(result).to.deep.equal({ ...mockCategory, ...updateData });
      expect(mockCategoryRepo.update).to.have.been.called();
    });
  });

  describe('deleteCategory', () => {
    const mockCategory: Category = {
      CATEGORIES_ID: 'cat123',
      NAME: 'Test Category'
    };

    it('should delete category successfully', async () => {
      mockCategoryRepo.findById.resolves(mockCategory);
      mockCategoryRepo.delete.resolves();

      await categoryService.deleteCategory('cat123');

      expect(mockCategoryRepo.findById).to.have.been.called.with('cat123');
      expect(mockCategoryRepo.delete).to.have.been.called.with('cat123');
    });

    it('should throw error if category not found', async () => {
      mockCategoryRepo.findById.resolves(null);

      try {
        await categoryService.deleteCategory('nonexistent');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('Error');
        expect(error.message).to.equal('Category not found');
      }

      expect(mockCategoryRepo.delete).to.not.have.been.called();
    });
  });
});
