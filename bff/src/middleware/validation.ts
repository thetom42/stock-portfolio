import type { TypedRequest, TypedResponse, NextFunction } from '../types/express';
import { body, param, query, validationResult, ValidationError } from 'express-validator';

// Define validation error response type
interface ValidationErrorResponse {
  errors: ValidationError[];
}

// Helper function to handle validation errors with proper typing
export const handleValidationErrors = (
  req: TypedRequest,
  res: TypedResponse<ValidationErrorResponse>,
  next: NextFunction
) => {
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
] as const;

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
] as const;

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
] as const;

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
] as const;

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
] as const;

export const validateHoldingUpdate = [
  body('quantity')
    .optional()
    .isFloat({ min: 0.000001 })
    .withMessage('Quantity must be greater than 0'),
  handleValidationErrors
] as const;

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
] as const;

// Category validation rules
export const validateCategoryCreation = [
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Category name is required'),
  handleValidationErrors
] as const;

export const validateCategoryUpdate = [
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Category name is required'),
  handleValidationErrors
] as const;

// Stock validation rules
export const validateStockCreation = [
  body('isin')
    .trim()
    .isLength({ min: 12, max: 12 })
    .matches(/^[A-Z]{2}[A-Z0-9]{9}\d$/)
    .withMessage('Invalid ISIN format'),
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Stock name is required'),
  body('wkn')
    .trim()
    .custom((value) => {
      if (!value.match(/^[A-Z0-9]{6}$/)) {
        throw new Error('Invalid WKN format');
      }
      return true;
    }),
  body('symbol')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Stock symbol is required'),
  body('categoryId')
    .isUUID()
    .withMessage('Invalid category ID'),
  handleValidationErrors
] as const;

export const validateStockUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Stock name cannot be empty'),
  body('wkn')
    .optional()
    .trim()
    .custom((value) => {
      if (!value.match(/^[A-Z0-9]{6}$/)) {
        throw new Error('Invalid WKN format');
      }
      return true;
    }),
  body('symbol')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Stock symbol cannot be empty'),
  body('categoryId')
    .optional()
    .isUUID()
    .withMessage('Invalid category ID'),
  handleValidationErrors
] as const;

export const validateStockSearch = [
  query('query')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Search query is required'),
  handleValidationErrors
] as const;

// Parameter validation
export const validateUUID = (paramName: string) => [
  param(paramName)
    .isUUID()
    .withMessage(`Invalid ${paramName} format`),
  handleValidationErrors
] as const;

export const validateIsin = (paramName: string) => [
  param(paramName)
    .trim()
    .isLength({ min: 12, max: 12 })
    .matches(/^[A-Z]{2}[A-Z0-9]{9}\d$/)
    .withMessage(`Invalid ISIN format`),
  handleValidationErrors
] as const;

export const validateWkn = (paramName: string) => [
  param(paramName)
    .trim()
    .custom((value) => {
      if (!value.match(/^[A-Z0-9]{6}$/)) {
        throw new Error('Invalid WKN format');
      }
      return true;
    }),
  handleValidationErrors
] as const;
