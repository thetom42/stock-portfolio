import { Router } from 'express';
import { protect } from '../config/keycloak';
import * as portfolioController from '../controllers/portfolioController';
import { validatePortfolioCreation, validatePortfolioUpdate, validateUUID } from '../middleware/validation';

const router = Router();

// All portfolio routes require authentication
router.use(protect());

// Portfolio routes
router.post('/', validatePortfolioCreation, portfolioController.createPortfolio);
router.get('/', portfolioController.getUserPortfolios);
router.get('/:id', validateUUID('id'), portfolioController.getPortfolio);
router.put('/:id', validateUUID('id'), validatePortfolioUpdate, portfolioController.updatePortfolio);
router.delete('/:id', validateUUID('id'), portfolioController.deletePortfolio);

// Portfolio summary and analysis
router.get('/:id/summary', validateUUID('id'), portfolioController.getPortfolioSummary);
router.get('/:id/performance', validateUUID('id'), portfolioController.getPortfolioPerformance);
router.get('/:id/holdings', validateUUID('id'), portfolioController.getPortfolioHoldings);

// Portfolio statistics
router.get('/:id/allocation', validateUUID('id'), portfolioController.getPortfolioAllocation);
router.get('/:id/returns', validateUUID('id'), portfolioController.getPortfolioReturns);
router.get('/:id/history', validateUUID('id'), portfolioController.getPortfolioHistory);

export default router;
