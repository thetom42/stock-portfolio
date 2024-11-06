import { Router } from 'express';
import { protect } from '../config/keycloak';
import * as holdingController from '../controllers/holdingController';
import { validateHoldingCreation, validateHoldingUpdate, validateUUID } from '../middleware/validation';

const router = Router();

// All holding routes require authentication
router.use(protect());

// Holding management routes
router.post('/', validateHoldingCreation, holdingController.createHolding);
router.get('/:id', validateUUID('id'), holdingController.getHolding);
router.put('/:id', validateUUID('id'), validateHoldingUpdate, holdingController.updateHolding);
router.delete('/:id', validateUUID('id'), holdingController.deleteHolding);

// Holding analysis routes
router.get('/:id/performance', validateUUID('id'), holdingController.getHoldingPerformance);
router.get('/:id/transactions', validateUUID('id'), holdingController.getHoldingTransactions);

// Holding value routes
router.get('/:id/value', validateUUID('id'), holdingController.getHoldingValue);
router.get('/:id/history', validateUUID('id'), holdingController.getHoldingHistory);

export default router;
