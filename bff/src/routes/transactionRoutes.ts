import { Router } from 'express';
import { protect } from '../config/keycloak';
import * as transactionController from '../controllers/transactionController';
import { validateTransactionCreation, validateUUID } from '../middleware/validation';

const router = Router();

// All transaction routes require authentication
router.use(protect());

// Transaction routes
router.post('/:holdingId', 
    validateUUID('holdingId'),
    validateTransactionCreation,
    transactionController.createTransaction
);

router.get('/:id',
    validateUUID('id'),
    transactionController.getTransaction
);

router.get('/holding/:holdingId',
    validateUUID('holdingId'),
    transactionController.getTransactionsByHolding
);

router.get('/portfolio/:portfolioId',
    validateUUID('portfolioId'),
    transactionController.getTransactionsByPortfolio
);

export default router;
