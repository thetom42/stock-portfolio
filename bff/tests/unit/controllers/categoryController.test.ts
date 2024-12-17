import { expect } from 'chai';
import sinon from 'sinon';
import * as categoryService from '../../../src/services/categoryService';
import * as categoryController from '../../../src/controllers/categoryController';
import { Category, CreateCategoryDTO } from '../../../src/models/Category';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
import { setupRepositoryMocks, resetRepositoryMocks, mockCategoryRepo } from '../../helpers/mockRepositories';

describe('CategoryController', () => {
  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    setupRepositoryMocks();
    res = createMockResponse();
    next = sinon.spy();
  });

  afterEach(() => {
    resetRepositoryMocks();
    sinon.restore();
  });

  describe('createCategory', () => {
    const mockCreateData: CreateCategoryDTO = {
      name: 'Technology'
    };

    // BFF layer response uses new naming
    const mockCreatedCategory: Category = {
      id: '1',
      name: mockCreateData.name
    };

    it('should create a category and return 201 status', async () => {
      req = createMockRequest({ body: mockCreateData });
      sinon.stub(categoryService, 'createCategory').resolves(mockCreatedCategory);

      await categoryController.createCategory(req as any, res, next);

      verifyResponse(res, 201, { category: mockCreatedCategory });
    });

    it('should return 409 if category name already exists', async () => {
      req = createMockRequest({ body: mockCreateData });
      const error = new Error('Category name already exists');
      sinon.stub(categoryService, 'createCategory').rejects(error);

      await categoryController.createCategory(req as any, res, next);

      verifyResponse(res, 409, { error: 'Category name already exists' });
    });

    it('should call next with error for other errors', async () => {
      req = createMockRequest({ body: mockCreateData });
      const error = new Error('Database error');
      sinon.stub(categoryService, 'createCategory').rejects(error);

      await categoryController.createCategory(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getAllCategories', () => {
    // BFF layer response uses new naming
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Technology'
      },
      {
        id: '2',
        name: 'Healthcare'
      }
    ];

    it('should return all categories', async () => {
      req = createMockRequest();
      sinon.stub(categoryService, 'getAllCategories').resolves(mockCategories);

      await categoryController.getAllCategories(req as any, res, next);

      verifyResponse(res, 200, { categories: mockCategories });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest();
      const error = new Error('Database error');
      sinon.stub(categoryService, 'getAllCategories').rejects(error);

      await categoryController.getAllCategories(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getCategoryById', () => {
    // BFF layer response uses new naming
    const mockCategory: Category = {
      id: '1',
      name: 'Technology'
    };

    it('should return category if found', async () => {
      req = createMockRequest({ params: { id: '1' } });
      sinon.stub(categoryService, 'getCategoryById').resolves(mockCategory);

      await categoryController.getCategoryById(req as any, res, next);

      verifyResponse(res, 200, { category: mockCategory });
    });

    it('should return 404 if category not found', async () => {
      req = createMockRequest({ params: { id: '999' } });
      sinon.stub(categoryService, 'getCategoryById').resolves(null);

      await categoryController.getCategoryById(req as any, res, next);

      verifyResponse(res, 404, { error: 'Category not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const error = new Error('Database error');
      sinon.stub(categoryService, 'getCategoryById').rejects(error);

      await categoryController.getCategoryById(req as any, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
