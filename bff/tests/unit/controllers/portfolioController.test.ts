import { expect } from 'chai';
import sinon from 'sinon';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express-serve-static-core';
import * as portfolioService from '../../../src/services/portfolioService';
import * as portfolioController from '../../../src/controllers/portfolioController';
import { CreatePortfolioDTO, UpdatePortfolioDTO, PortfolioDetails } from '../../../src/models/Portfolio';

type MockResponse = {
  status: (code: number) => MockResponse;
  json: (body: any) => void;
  send: () => void;
};

describe('PortfolioController', () => {
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

  describe('createPortfolio', () => {
    const mockCreateData: CreatePortfolioDTO = {
      name: 'Test Portfolio',
      description: 'Test Description'
    };

    const mockCreatedPortfolio: PortfolioDetails = {
      id: '1',
      userId: 'user1',
      name: 'Test Portfolio',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
      holdings: []
    };

    it('should create a portfolio and return 201 status', async () => {
      req = {
        body: mockCreateData,
        user: { id: 'user1' }
      } as ExpressRequest;

      sinon.stub(portfolioService, 'createPortfolio').resolves(mockCreatedPortfolio);

      await portfolioController.createPortfolio(req as any, res as any, next);

      expect(statusStub.calledWith(201)).to.be.true;
      expect(jsonStub.calledWith(mockCreatedPortfolio)).to.be.true;
    });

    it('should call next with error if creation fails', async () => {
      req = {
        body: mockCreateData,
        user: { id: 'user1' }
      } as ExpressRequest;

      const error = new Error('Database error');
      sinon.stub(portfolioService, 'createPortfolio').rejects(error);

      await portfolioController.createPortfolio(req as any, res as any, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getPortfolio', () => {
    const mockPortfolio: PortfolioDetails = {
      id: '1',
      userId: 'user1',
      name: 'Test Portfolio',
      description: 'Test Description',
      createdAt: new Date(),
      updatedAt: new Date(),
      holdings: []
    };

    it('should return portfolio if found', async () => {
      req = {
        params: { id: '1' },
        user: { id: 'user1' }
      } as any;

      sinon.stub(portfolioService, 'getPortfolioById').resolves(mockPortfolio);

      await portfolioController.getPortfolio(req as any, res as any, next);

      expect(jsonStub.calledWith(mockPortfolio)).to.be.true;
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        params: { id: '999' },
        user: { id: 'user1' }
      } as any;

      sinon.stub(portfolioService, 'getPortfolioById').resolves(null);

      await portfolioController.getPortfolio(req as any, res as any, next);

      expect(statusStub.calledWith(404)).to.be.true;
      expect(jsonStub.calledWith({ error: 'Portfolio not found' })).to.be.true;
    });
  });

  describe('updatePortfolio', () => {
    const mockUpdateData: UpdatePortfolioDTO = {
      name: 'Updated Portfolio',
      description: 'Updated Description'
    };

    const mockUpdatedPortfolio: PortfolioDetails = {
      id: '1',
      userId: 'user1',
      name: 'Updated Portfolio',
      description: 'Updated Description',
      createdAt: new Date(),
      updatedAt: new Date(),
      holdings: []
    };

    it('should update portfolio and return updated data', async () => {
      req = {
        params: { id: '1' },
        body: mockUpdateData,
        user: { id: 'user1' }
      } as any;

      sinon.stub(portfolioService, 'updatePortfolio').resolves(mockUpdatedPortfolio);

      await portfolioController.updatePortfolio(req as any, res as any, next);

      expect(jsonStub.calledWith(mockUpdatedPortfolio)).to.be.true;
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        params: { id: '999' },
        body: mockUpdateData,
        user: { id: 'user1' }
      } as any;

      sinon.stub(portfolioService, 'updatePortfolio').resolves(null);

      await portfolioController.updatePortfolio(req as any, res as any, next);

      expect(statusStub.calledWith(404)).to.be.true;
      expect(jsonStub.calledWith({ error: 'Portfolio not found' })).to.be.true;
    });
  });

  describe('deletePortfolio', () => {
    it('should delete portfolio and return 204 status', async () => {
      req = {
        params: { id: '1' },
        user: { id: 'user1' }
      } as any;

      sinon.stub(portfolioService, 'deletePortfolio').resolves();

      await portfolioController.deletePortfolio(req as any, res as any, next);

      expect(statusStub.calledWith(204)).to.be.true;
      expect(sendStub.called).to.be.true;
    });

    it('should return 404 if portfolio not found', async () => {
      req = {
        params: { id: '999' },
        user: { id: 'user1' }
      } as any;

      const error = new Error('Portfolio not found');
      sinon.stub(portfolioService, 'deletePortfolio').rejects(error);

      await portfolioController.deletePortfolio(req as any, res as any, next);

      expect(statusStub.calledWith(404)).to.be.true;
      expect(jsonStub.calledWith({ error: 'Portfolio not found' })).to.be.true;
    });
  });
});
