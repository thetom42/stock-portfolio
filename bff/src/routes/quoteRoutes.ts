import { protect } from '../config/keycloak';
import * as quoteController from '../controllers/quoteController';
import { validateUUID } from '../middleware/validation';

import express = require('express');
const router = express.Router();

// All quote routes require authentication
router.use(protect());

// Quote routes
router.get('/stock/:isin/latest',
    quoteController.getLatestQuote
);

router.get('/stock/:isin/history',
    quoteController.getQuoteHistory
);

router.get('/stock/:isin/intraday',
    quoteController.getIntradayQuotes
);

router.get('/portfolio/:portfolioId/quotes',
    validateUUID('portfolioId'),
    quoteController.getPortfolioQuotes
);

router.get('/holding/:holdingId/quotes',
    validateUUID('holdingId'),
    quoteController.getHoldingQuotes
);

export default router;
