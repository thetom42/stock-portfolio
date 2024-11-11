import { Router } from 'express';
import { protect } from '../config/keycloak';
import * as transactionController from '../controllers/transactionController';
import { validateTransactionCreation, validateUUID } from '../middleware/validation';

const router = Router();

// All transaction routes require authentication
router.use(protect());

// Create transaction for a holding
router.post('/holding/:holdingId', 
    validateUUID('holdingId'),
    validateTransactionCreation,
    transactionController.createTransaction
);

// Get transactions by holding with optional filters
// Query params:
// - startDate: ISO date string
// - endDate: ISO date string
// - type: 'BUY' | 'SELL'
// - sort: 'date' | 'amount' | 'price'
// - order: 'asc' | 'desc'
// - page: number
// - limit: number
router.get('/holding/:holdingId',
    validateUUID('holdingId'),
    transactionController.getTransactionsByHolding
);

// Get transactions by portfolio with optional filters
// Query params:
// - startDate: ISO date string
// - endDate: ISO date string
// - type: 'BUY' | 'SELL'
// - sort: 'date' | 'amount' | 'price'
// - order: 'asc' | 'desc'
// - page: number
// - limit: number
router.get('/portfolio/:portfolioId',
    validateUUID('portfolioId'),
    transactionController.getTransactionsByPortfolio
);

// Get single transaction by ID
router.get('/:id',
    validateUUID('id'),
    transactionController.getTransaction
);

export default router;
