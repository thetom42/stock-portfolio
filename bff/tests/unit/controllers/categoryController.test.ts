import { expect, use } from 'chai';
import spies from 'chai-spies';
import { Request, Response } from 'express';
import { describe, it, beforeEach, afterEach } from 'mocha';
import * as categoryService from '../../../src/services/categoryService';
import * as categoryController from '../../../src/controllers/categoryController';
import { Category, CreateCategoryDTO, UpdateCategoryDTO, CategoryResponse } from '../../../src/models/Category';

use(spies);

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('CategoryController', () => {
  let req: Partial<Request>;
  let res: MockResponse;
  let next: any;

  beforeEach(() => {
    res = {
      status: chai.spy(function(this: MockResponse, code: number) { return this; }),
      json: chai.spy(),
      send: chai.spy()
    };
    next = chai.spy();
  });

  afterEach(() => {
    chai.spy.restore();
  });

  describe('createCategory', () => {
    const mockCreateData: CreateCategoryDTO = {
      NAME: 'Test Category'
    };

    const mockCreatedCategory: CategoryResponse = {
      CATEGORIES_ID: '1',
      NAME: 'Test Category'
    };

    it('should create a category and return 201 status', async () => {
      req = {
        body: mockCreateData
      } as Request;

      chai.spy.on(categoryService, 'createCategory', () => Promise.resolve(mockCreatedCategory));

      await categoryController.createCategory(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(201);
      expect(res.json).to.have.been.called.with(mockCreatedCategory);
    });

    it('should return 409 if category name already exists', async () => {
      req = {
        body: mockCreateData
      } as Request;

      const error = new Error('Category with this name already exists');
      chai.spy.on(categoryService, 'createCategory', () => Promise.reject(error));

      await categoryController.createCategory(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(409);
      expect(res.json).to.have.been.called.with({ error: 'Category with this name already exists' });
    });

    it('should call next with error for other errors', async () => {
      req = {
        body: mockCreateData
      } as Request;

      const error = new Error('Database error');
      chai.spy.on(categoryService, 'createCategory', () => Promise.reject(error));

      await categoryController.createCategory(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });

  describe('getCategoryById', () => {
    const mockCategory: CategoryResponse = {
      CATEGORIES_ID: '1',
      NAME: 'Test Category'
    };

    it('should return category if found', async () => {
      req = {
        params: { id: '1' }
      } as Request<{ id: string }>;

      chai.spy.on(categoryService, 'getCategoryById', () => Promise.resolve(mockCategory));

      await categoryController.getCategoryById(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockCategory);
    });

    it('should return 404 if category not found', async () => {
      req = {
        params: { id: '999' }
      } as Request<{ id: string }>;

      chai.spy.on(categoryService, 'getCategoryById', () => Promise.resolve(null));

      await categoryController.getCategoryById(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ error: 'Category not found' });
    });
  });

  describe('getAllCategories', () => {
    const mockCategories: CategoryResponse[] = [
      { CATEGORIES_ID: '1', NAME: 'Category 1' },
      { CATEGORIES_ID: '2', NAME: 'Category 2' }
    ];

    it('should return all categories', async () => {
      req = {} as Request;

      chai.spy.on(categoryService, 'getAllCategories', () => Promise.resolve(mockCategories));

      await categoryController.getAllCategories(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockCategories);
    });

    it('should call next with error if retrieval fails', async () => {
      req = {} as Request;

      const error = new Error('Database error');
      chai.spy.on(categoryService, 'getAllCategories', () => Promise.reject(error));

      await categoryController.getAllCategories(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });

  describe('updateCategory', () => {
    const mockUpdateData: UpdateCategoryDTO = {
      NAME: 'Updated Category'
    };

    const mockUpdatedCategory: CategoryResponse = {
      CATEGORIES_ID: '1',
      NAME: 'Updated Category'
    };

    it('should update category and return updated data', async () => {
      req = {
        params: { id: '1' },
        body: mockUpdateData
      } as Request<{ id: string }>;

      chai.spy.on(categoryService, 'updateCategory', () => Promise.resolve(mockUpdatedCategory));

      await categoryController.updateCategory(req as any, res as any, next);

      expect(res.json).to.have.been.called.with(mockUpdatedCategory);
    });

    it('should return 404 if category not found', async () => {
      req = {
        params: { id: '999' },
        body: mockUpdateData
      } as Request<{ id: string }>;

      const error = new Error('Category not found');
      chai.spy.on(categoryService, 'updateCategory', () => Promise.reject(error));

      await categoryController.updateCategory(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ error: 'Category not found' });
    });

    it('should return 409 if updated name already exists', async () => {
      req = {
        params: { id: '1' },
        body: mockUpdateData
      } as Request<{ id: string }>;

      const error = new Error('Category with this name already exists');
      chai.spy.on(categoryService, 'updateCategory', () => Promise.reject(error));

      await categoryController.updateCategory(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(409);
      expect(res.json).to.have.been.called.with({ error: 'Category with this name already exists' });
    });
  });

  describe('deleteCategory', () => {
    it('should delete category and return 204 status', async () => {
      req = {
        params: { id: '1' }
      } as Request<{ id: string }>;

      chai.spy.on(categoryService, 'deleteCategory', () => Promise.resolve());

      await categoryController.deleteCategory(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(204);
      expect(res.send).to.have.been.called();
    });

    it('should return 404 if category not found', async () => {
      req = {
        params: { id: '999' }
      } as Request<{ id: string }>;

      const error = new Error('Category not found');
      chai.spy.on(categoryService, 'deleteCategory', () => Promise.reject(error));

      await categoryController.deleteCategory(req as any, res as any, next);

      expect(res.status).to.have.been.called.with(404);
      expect(res.json).to.have.been.called.with({ error: 'Category not found' });
    });

    it('should call next with error for other errors', async () => {
      req = {
        params: { id: '1' }
      } as Request<{ id: string }>;

      const error = new Error('Database error');
      chai.spy.on(categoryService, 'deleteCategory', () => Promise.reject(error));

      await categoryController.deleteCategory(req as any, res as any, next);

      expect(next).to.have.been.called.with(error);
    });
  });
});
