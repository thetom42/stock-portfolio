import { expect } from 'chai';
import sinon from 'sinon';
import { categoryService } from '../../../src/services/categoryService';
import * as categoryController from '../../../src/controllers/categoryController';
import { Category } from '../../../src/models/Category';
import { createMockRequest, RequestWithUser } from '../../helpers/mockRequest';
import { createMockResponse, MockResponse, verifyResponse } from '../../helpers/mockResponse';
describe('CategoryController', () => {
  let req: Partial<RequestWithUser>;
  let res: MockResponse;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    res = createMockResponse();
    next = sinon.spy();
    // Stub categoryService methods
    sinon.stub(categoryService, 'createCategory');
    sinon.stub(categoryService, 'getAllCategories');
    sinon.stub(categoryService, 'getCategoryById');
    sinon.stub(categoryService, 'updateCategory');
    sinon.stub(categoryService, 'deleteCategory');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createCategory', () => {
    const mockCreateData = {
      name: 'Technology'
    };

    it('should create category and return 201 status', async () => {
      req = createMockRequest({ body: mockCreateData });
      (categoryService.createCategory as sinon.SinonStub).resolves({
        id: '1',
        name: mockCreateData.name
      });

      await categoryController.createCategory(req as any, res as any, next);

      verifyResponse(res, 201, {
        category: {
          id: '1',
          name: mockCreateData.name
        }
      });
    });

    it('should return 409 if category already exists', async () => {
      req = createMockRequest({ body: mockCreateData });
      (categoryService.createCategory as sinon.SinonStub).rejects(new Error('Category name already exists'));

      await categoryController.createCategory(req as any, res as any, next);

      verifyResponse(res, 409, { error: 'Category name already exists' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ body: mockCreateData });
      const error = new Error('Failed to create category');
      (categoryService.createCategory as sinon.SinonStub).rejects(error);

      await categoryController.createCategory(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      req = createMockRequest({});
      (categoryService.getAllCategories as sinon.SinonStub).resolves([
        {
          id: '1',
          name: 'Technology'
        }
      ]);

      await categoryController.getAllCategories(req as any, res as any, next);

      verifyResponse(res, 200, {
        categories: [{
          id: '1',
          name: 'Technology'
        }]
      });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({});
      const error = new Error('Failed to fetch categories');
      (categoryService.getAllCategories as sinon.SinonStub).rejects(error);

      await categoryController.getAllCategories(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getCategoryById', () => {
    it('should return category if found', async () => {
      req = createMockRequest({ params: { id: '1' } });
      (categoryService.getCategoryById as sinon.SinonStub).resolves({
        id: '1',
        name: 'Technology'
      });

      await categoryController.getCategoryById(req as any, res as any, next);

      verifyResponse(res, 200, {
        category: {
          id: '1',
          name: 'Technology'
        }
      });
    });

    it('should return 404 if category not found', async () => {
      req = createMockRequest({ params: { id: '999' } });
      (categoryService.getCategoryById as sinon.SinonStub).resolves(null);

      await categoryController.getCategoryById(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Category not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const error = new Error('Failed to fetch category');
      (categoryService.getCategoryById as sinon.SinonStub).rejects(error);

      await categoryController.getCategoryById(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('updateCategory', () => {
    const mockUpdateData = {
      name: 'Updated Technology'
    };

    it('should update category successfully', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData
      });
      (categoryService.updateCategory as sinon.SinonStub).resolves({
        id: '1',
        name: mockUpdateData.name
      });

      await categoryController.updateCategory(req as any, res as any, next);

      verifyResponse(res, 200, {
        category: {
          id: '1',
          name: mockUpdateData.name
        }
      });
    });

    it('should return 404 if category not found', async () => {
      req = createMockRequest({
        params: { id: '999' },
        body: mockUpdateData
      });
      (categoryService.updateCategory as sinon.SinonStub).resolves(null);

      await categoryController.updateCategory(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Category not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({
        params: { id: '1' },
        body: mockUpdateData
      });
      const error = new Error('Failed to update category');
      (categoryService.updateCategory as sinon.SinonStub).rejects(error);

      await categoryController.updateCategory(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      (categoryService.deleteCategory as sinon.SinonStub).resolves({
        id: '1',
        name: 'Technology'
      });

      await categoryController.deleteCategory(req as any, res as any, next);

      verifyResponse(res, 204);
    });

    it('should return 404 if category not found', async () => {
      req = createMockRequest({ params: { id: '999' } });
      (categoryService.deleteCategory as sinon.SinonStub).rejects(new Error('Category not found'));

      await categoryController.deleteCategory(req as any, res as any, next);

      verifyResponse(res, 404, { error: 'Category not found' });
    });

    it('should handle errors gracefully', async () => {
      req = createMockRequest({ params: { id: '1' } });
      const error = new Error('Failed to delete category');
      (categoryService.deleteCategory as sinon.SinonStub).rejects(error);

      await categoryController.deleteCategory(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
