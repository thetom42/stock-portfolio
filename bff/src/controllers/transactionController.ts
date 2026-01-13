import type { TypedResponse, NextFunction, AuthenticatedRequest } from '../types/express';
import {
  CreateTransactionDTO,
  TransactionQueryParams,
  Transaction,
  PaginatedTransactions
} from '../models/Transaction';
import { transactionService } from '../services/transactionService';
import { holdingService } from '../services/holdingService';
import { portfolioService } from '../services/portfolioService';

// Define response types
type TransactionResponse = { transaction: Transaction };
type ErrorResponse = { error: string };

export const createTransaction = async (
  req: AuthenticatedRequest<{ holdingId: string }, {}, CreateTransactionDTO>,
  res: TypedResponse<TransactionResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.holdingId;
    const transactionData = req.body;

    // First check if holding exists
    const holding = await holdingService.getHoldingById(holdingId);
    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    // Verify user owns the portfolio that contains this holding
    const portfolio = await portfolioService.getPortfolioById(holding.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const transaction = await transactionService.createTransaction(
      holdingId,
      transactionData
    );

    res.status(201).json({ transaction });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Insufficient holding quantity for sell transaction') {
        res.status(400).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};

export const getTransaction = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<TransactionResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const transactionId = req.params.id;

    const transaction = await transactionService.getTransactionById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verify user owns the portfolio that contains this holding
    const holding = await holdingService.getHoldingById(transaction.holdingId);
    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    const portfolio = await portfolioService.getPortfolioById(holding.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
};

interface TransactionQueryString {
  startDate?: string;
  endDate?: string;
  type?: 'BUY' | 'SELL';
  sort?: 'date' | 'amount' | 'price';
  order?: 'asc' | 'desc';
  page?: string;
  limit?: string;
}

export const getTransactionsByHolding = async (
  req: AuthenticatedRequest<
    { holdingId: string },
    {},
    {},
    TransactionQueryString
  >,
  res: TypedResponse<PaginatedTransactions | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.holdingId;

    // First check if holding exists
    const holding = await holdingService.getHoldingById(holdingId);
    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    // Verify user owns the portfolio that contains this holding
    const portfolio = await portfolioService.getPortfolioById(holding.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const queryParams: TransactionQueryParams = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      type: req.query.type,
      sort: req.query.sort,
      order: req.query.order,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    };

    const paginatedTransactions = await transactionService.getTransactionsByHolding(
      holdingId,
      queryParams
    );

    res.status(200).json(paginatedTransactions);
  } catch (error) {
    next(error);
  }
};

export const getTransactionsByPortfolio = async (
  req: AuthenticatedRequest<
    { portfolioId: string },
    {},
    {},
    TransactionQueryString
  >,
  res: TypedResponse<PaginatedTransactions | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const portfolioId = req.params.portfolioId;

    // First check if portfolio exists
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const queryParams: TransactionQueryParams = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      type: req.query.type,
      sort: req.query.sort,
      order: req.query.order,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    };

    const paginatedTransactions = await transactionService.getTransactionsByPortfolio(
      portfolioId,
      queryParams
    );

    res.status(200).json(paginatedTransactions);
  } catch (error) {
    next(error);
  }
};
