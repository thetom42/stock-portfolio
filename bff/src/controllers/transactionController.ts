import type { Response, NextFunction } from 'express-serve-static-core';
import { CreateTransactionDTO, TransactionQueryParams } from '../models/Transaction';
import * as transactionService from '../services/transactionService';
import { AuthenticatedRequest } from '../types/express';

export const createTransaction = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.holdingId;
    const transactionData = req.body as CreateTransactionDTO;

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
  req: AuthenticatedRequest,
  res: Response,
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

type TransactionQueryString = {
  startDate?: string;
  endDate?: string;
  type?: string;
  sort?: string;
  order?: string;
  page?: string;
  limit?: string;
};

export const getTransactionsByHolding = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.holdingId;
    const queryParams: TransactionQueryParams = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      type: req.query.type as 'BUY' | 'SELL' | undefined,
      sort: req.query.sort as 'date' | 'amount' | 'price' | undefined,
      order: req.query.order as 'asc' | 'desc' | undefined,
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const portfolioId = req.params.portfolioId;
    const queryParams: TransactionQueryParams = {
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      type: req.query.type as 'BUY' | 'SELL' | undefined,
      sort: req.query.sort as 'date' | 'amount' | 'price' | undefined,
      order: req.query.order as 'asc' | 'desc' | undefined,
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
