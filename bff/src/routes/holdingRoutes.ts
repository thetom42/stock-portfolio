import { protect } from '../config/keycloak';
import * as holdingController from '../controllers/holdingController';
import { validateHoldingCreation, validateHoldingUpdate, validateUUID } from '../middleware/validation';
import { assertAuthenticated, asAuthenticatedHandler } from '../middleware/auth';

import express = require('express');
const router = express.Router();

// All holding routes require authentication
router.use(protect());
router.use(assertAuthenticated);

// Holding management routes
router.post('/', validateHoldingCreation, asAuthenticatedHandler(holdingController.createHolding));
router.get('/:id', validateUUID('id'), asAuthenticatedHandler(holdingController.getHolding));
router.put('/:id', validateUUID('id'), validateHoldingUpdate, asAuthenticatedHandler(holdingController.updateHolding));
router.delete('/:id', validateUUID('id'), asAuthenticatedHandler(holdingController.deleteHolding));

// Holding analysis routes
router.get('/:id/performance', validateUUID('id'), asAuthenticatedHandler(holdingController.getHoldingPerformance));
router.get('/:id/transactions', validateUUID('id'), asAuthenticatedHandler(holdingController.getHoldingTransactions));

// Holding value routes
router.get('/:id/value', validateUUID('id'), asAuthenticatedHandler(holdingController.getHoldingValue));
router.get('/:id/history', validateUUID('id'), asAuthenticatedHandler(holdingController.getHoldingHistory));

export default router;
