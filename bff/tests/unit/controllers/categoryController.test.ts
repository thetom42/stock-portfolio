import { expect } from 'chai';
import sinon from 'sinon';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express-serve-static-core';
import * as categoryService from '../../../src/services/categoryService';
import * as categoryController from '../../../src/controllers/categoryController';
import { Category, CreateCategoryDTO, UpdateCategoryDTO, CategoryResponse } from '../../../src/models/Category';

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('CategoryController', () => {
  let req: Partial<ExpressRequest>;
  let res: MockResponse;
  let next: sinon.SinonSpy;
  let statusStub: sinon.SinonSpy;
  let jsonStub: sinon.SinonSpy;
  let sendStub: sinon.SinonSpy;

  beforeEach(() => {
    statusStub = sinon.spy((code: number) => res);
    jsonStub = sinon.spy();
    sendStub = sinon.spy();
    
    res = {
      status: statusStub,
      json: jsonStub,
      send: sendStub
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
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
      } as ExpressRequest;

      sinon.stub(categoryService, 'createCategory').resolves(mockCreatedCategory);

      await categoryController.createCategory(req as any, res as any, next);

      expect(statusStub.calledWith(201)).to.be.true;
      expect(jsonStub.calledWith(mockCreatedCategory)).to.be.true;
    });

    it('should return 409 if category name already exists', async () => {
      req = {
        body: mockCreateData
      } as ExpressRequest;

      const error = new Error('Category with this name already exists');
      sinon.stub(categoryService, 'createCategory').rejects(error);

      await categoryController.createCategory(req as any, res as any, next);

      expect(statusStub.calledWith(409)).to.be.true;
      expect(jsonStub.calledWith({ error: 'Category with this name already exists' })).to.be.true;
    });

    it('should call next with error for other errors', async () => {
      req = {
        body: mockCreateData
      } as ExpressRequest;

      const error = new Error('Database error');
      sinon.stub(categoryService, 'createCategory').rejects(error);

      await categoryController.createCategory(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
