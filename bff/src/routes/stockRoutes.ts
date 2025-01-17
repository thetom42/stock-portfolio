import { param } from 'express-validator';
import { protect } from '../config/keycloak';
import * as stockController from '../controllers/stockController';
import {
    validateUUID,
    validateIsin,
    validateWkn,
    validateStockCreation,
    validateStockUpdate,
    validateStockSearch,
    handleValidationErrors
} from '../middleware/validation';

import express = require('express');
const router = express.Router();

// All stock routes require authentication
router.use(protect());

// Search stocks
router.get('/search',
    validateStockSearch,
    stockController.searchStocks
);

// Get all stocks
router.get('/', stockController.getAllStocks);

// Get stocks by category
router.get('/category/:categoryId',
    validateUUID('categoryId'),
    stockController.getStocksByCategory
);

// Create new stock
router.post('/',
    validateStockCreation,
    stockController.createStock
);

// Get stock by ISIN
router.get('/isin/:isin',
    validateIsin('isin'),
    stockController.getStockByIsin
);

// Get stock by Symbol
router.get('/symbol/:symbol',
    [
        param('symbol')
            .trim()
            .isLength({ min: 1 })
            .withMessage('Stock symbol is required'),
        handleValidationErrors
    ],
    stockController.getStockBySymbol
);

// Get stock by WKN
router.get('/wkn/:wkn',
    validateWkn('wkn'),
    stockController.getStockByWkn
);

// Get detailed stock information
router.get('/details/:isin',
    validateIsin('isin'),
    stockController.getStockDetails
);

// Update stock
router.put('/:isin',
    validateIsin('isin'),
    validateStockUpdate,
    stockController.updateStock
);

// Delete stock
router.delete('/:isin',
    validateIsin('isin'),
    stockController.deleteStock
);

export default router;
