import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

// Helper function to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// User validation rules
export const validateUserCreation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('firstName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/)
    .withMessage('Password must contain at least one letter and one number'),
  handleValidationErrors
];

export const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  handleValidationErrors
];

// Portfolio validation rules
export const validatePortfolioCreation = [
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Portfolio name is required'),
  body('description')
    .optional()
    .trim(),
  handleValidationErrors
];

export const validatePortfolioUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Portfolio name cannot be empty'),
  body('description')
    .optional()
    .trim(),
  handleValidationErrors
];

// Holding validation rules
export const validateHoldingCreation = [
  body('stockId')
    .isUUID()
    .withMessage('Invalid stock ID'),
  body('quantity')
    .isFloat({ min: 0.000001 })
    .withMessage('Quantity must be greater than 0'),
  body('purchasePrice')
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be greater than or equal to 0'),
  handleValidationErrors
];

export const validateHoldingUpdate = [
  body('quantity')
    .optional()
    .isFloat({ min: 0.000001 })
    .withMessage('Quantity must be greater than 0'),
  handleValidationErrors
];

// Transaction validation rules
export const validateTransactionCreation = [
  body('type')
    .isIn(['BUY', 'SELL'])
    .withMessage('Transaction type must be either BUY or SELL'),
  body('quantity')
    .isFloat({ min: 0.000001 })
    .withMessage('Quantity must be greater than 0'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be greater than or equal to 0'),
  body('fees')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Fees must be greater than or equal to 0'),
  body('notes')
    .optional()
    .trim(),
  handleValidationErrors
];

// Parameter validation
export const validateUUID = (paramName: string) => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors
];
