import { protect } from '../config/keycloak';
import * as portfolioController from '../controllers/portfolioController';
import { validatePortfolioCreation, validatePortfolioUpdate, validateUUID } from '../middleware/validation';
import type { Request, Response, NextFunction } from 'express-serve-static-core';
import { AuthenticatedRequest } from '../types/express';
import { CreatePortfolioDTO, UpdatePortfolioDTO } from '../models/Portfolio';

import express = require('express');
const router = express.Router();

// All portfolio routes require authentication
router.use(protect());

// Portfolio routes
router.post('/', validatePortfolioCreation, (req: Request, res: Response, next: NextFunction) => {
  portfolioController.createPortfolio(req as AuthenticatedRequest & { body: CreatePortfolioDTO }, res, next);
});

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  portfolioController.getUserPortfolios(req as AuthenticatedRequest, res, next);
});

router.get('/:id', validateUUID('id'), (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  portfolioController.getPortfolio(req as AuthenticatedRequest & { params: { id: string } }, res, next);
});

router.put('/:id', validateUUID('id'), validatePortfolioUpdate, (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  portfolioController.updatePortfolio(req as AuthenticatedRequest & { params: { id: string }, body: UpdatePortfolioDTO }, res, next);
});

router.delete('/:id', validateUUID('id'), (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  portfolioController.deletePortfolio(req as AuthenticatedRequest & { params: { id: string } }, res, next);
});

// Portfolio summary and analysis
router.get('/:id/summary', validateUUID('id'), (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  portfolioController.getPortfolioSummary(req as AuthenticatedRequest & { params: { id: string } }, res, next);
});

router.get('/:id/performance', validateUUID('id'), (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  portfolioController.getPortfolioPerformance(req as AuthenticatedRequest & { params: { id: string } }, res, next);
});

router.get('/:id/holdings', validateUUID('id'), (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  portfolioController.getPortfolioHoldings(req as AuthenticatedRequest & { params: { id: string } }, res, next);
});

// Portfolio statistics
router.get('/:id/allocation', validateUUID('id'), (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  portfolioController.getPortfolioAllocation(req as AuthenticatedRequest & { params: { id: string } }, res, next);
});

router.get('/:id/returns', validateUUID('id'), (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  portfolioController.getPortfolioReturns(req as AuthenticatedRequest & { params: { id: string } }, res, next);
});

router.get('/:id/history', validateUUID('id'), (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  portfolioController.getPortfolioHistory(req as AuthenticatedRequest & { params: { id: string } }, res, next);
});

export default router;
