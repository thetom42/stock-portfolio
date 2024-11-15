import { protect } from '../config/keycloak';
import * as portfolioController from '../controllers/portfolioController';
import { validatePortfolioCreation, validatePortfolioUpdate, validateUUID } from '../middleware/validation';
import type { TypedRequest, TypedResponse, NextFunction, AuthenticatedRequest } from '../types/express';
import { 
  CreatePortfolioDTO, 
  UpdatePortfolioDTO,
  PortfolioResponse,
  PortfoliosResponse,
  SummaryResponse,
  PerformanceResponse,
  HoldingsResponse,
  AllocationResponse,
  ReturnsResponse,
  HistoryResponse,
  ErrorResponse
} from '../models/Portfolio';

import express = require('express');
const router = express.Router();

// All portfolio routes require authentication
router.use(protect());

// Portfolio routes
router.post('/',
  validatePortfolioCreation,
  (
    req: AuthenticatedRequest<{}, {}, CreatePortfolioDTO>,
    res: TypedResponse<PortfolioResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    portfolioController.createPortfolio(req, res, next);
  }
);

router.get('/',
  (
    req: AuthenticatedRequest,
    res: TypedResponse<PortfoliosResponse>,
    next: NextFunction
  ) => {
    portfolioController.getUserPortfolios(req, res, next);
  }
);

router.get('/:id',
  validateUUID('id'),
  (
    req: AuthenticatedRequest<{ id: string }>,
    res: TypedResponse<PortfolioResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    portfolioController.getPortfolio(req, res, next);
  }
);

router.put('/:id',
  validateUUID('id'),
  validatePortfolioUpdate,
  (
    req: AuthenticatedRequest<{ id: string }, {}, UpdatePortfolioDTO>,
    res: TypedResponse<PortfolioResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    portfolioController.updatePortfolio(req, res, next);
  }
);

router.delete('/:id',
  validateUUID('id'),
  (
    req: AuthenticatedRequest<{ id: string }>,
    res: TypedResponse<void | ErrorResponse>,
    next: NextFunction
  ) => {
    portfolioController.deletePortfolio(req, res, next);
  }
);

// Portfolio summary and analysis
router.get('/:id/summary',
  validateUUID('id'),
  (
    req: AuthenticatedRequest<{ id: string }>,
    res: TypedResponse<SummaryResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    portfolioController.getPortfolioSummary(req, res, next);
  }
);

router.get('/:id/performance',
  validateUUID('id'),
  (
    req: AuthenticatedRequest<{ id: string }>,
    res: TypedResponse<PerformanceResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    portfolioController.getPortfolioPerformance(req, res, next);
  }
);

router.get('/:id/holdings',
  validateUUID('id'),
  (
    req: AuthenticatedRequest<{ id: string }>,
    res: TypedResponse<HoldingsResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    portfolioController.getPortfolioHoldings(req, res, next);
  }
);

// Portfolio statistics
router.get('/:id/allocation',
  validateUUID('id'),
  (
    req: AuthenticatedRequest<{ id: string }>,
    res: TypedResponse<AllocationResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    portfolioController.getPortfolioAllocation(req, res, next);
  }
);

router.get('/:id/returns',
  validateUUID('id'),
  (
    req: AuthenticatedRequest<{ id: string }>,
    res: TypedResponse<ReturnsResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    portfolioController.getPortfolioReturns(req, res, next);
  }
);

router.get('/:id/history',
  validateUUID('id'),
  (
    req: AuthenticatedRequest<{ id: string }>,
    res: TypedResponse<HistoryResponse | ErrorResponse>,
    next: NextFunction
  ) => {
    portfolioController.getPortfolioHistory(req, res, next);
  }
);

export default router;
