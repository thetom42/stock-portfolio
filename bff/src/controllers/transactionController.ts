import type { TypedResponse, NextFunction, AuthenticatedRequest } from '../types/express';
import { 
  CreateTransactionDTO, 
  TransactionQueryParams, 
  Transaction,
  PaginatedTransactions 
} from '../models/Transaction';
import * as transactionService from '../services/transactionService';

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

    const transaction = await transactionService.createTransaction(
      userId,
      holdingId,
      transactionData
    );

    res.status(201).json({ transaction });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Holding not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else if (error.message === 'Insufficient holding quantity for sell transaction') {
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

    const transaction = await transactionService.getTransactionById(
      userId,
      transactionId
    );

    res.json({ transaction });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Transaction not found' || error.message === 'Holding not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
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
      userId,
      holdingId,
      queryParams
    );

    res.status(200).json(paginatedTransactions);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Holding not found') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
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
      userId,
      portfolioId,
      queryParams
    );

    res.status(200).json(paginatedTransactions);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        res.status(403).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};
