import { Router } from 'express';
import { param } from 'express-validator';
import { protect } from '../config/keycloak';
import * as stockController from '../controllers/stockController';
import {
    validateUUID,
    validateISIN,
    validateWKN,
    validateStockCreation,
    validateStockUpdate,
    validateStockSearch,
    handleValidationErrors
} from '../middleware/validation';

const router = Router();

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
    validateISIN('isin'),
    stockController.getStockByISIN
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
    validateWKN('wkn'),
    stockController.getStockByWKN
);

// Get detailed stock information
router.get('/details/:isin',
    validateISIN('isin'),
    stockController.getStockDetails
);

// Update stock
router.put('/:isin',
    validateISIN('isin'),
    validateStockUpdate,
    stockController.updateStock
);

// Delete stock
router.delete('/:isin',
    validateISIN('isin'),
    stockController.deleteStock
);

export default router;
