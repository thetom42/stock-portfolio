import { Request, Response, NextFunction } from 'express';
import { CreateTransactionDTO, TransactionQueryParams } from '../models/Transaction';
import * as transactionService from '../services/transactionService';

export const createTransaction = async (
  req: Request<{ holdingId: string }, {}, CreateTransactionDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const holdingId = req.params.holdingId;
    const transactionData = req.body;

    const transaction = await transactionService.createTransaction(
      userId,
      holdingId,
      transactionData
    );

    res.status(201).json(transaction);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Holding not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ message: error.message });
      } else if (error.message === 'Insufficient holding quantity for sell transaction') {
        res.status(400).json({ message: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};

export const getTransaction = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const transactionId = req.params.id;

    const transaction = await transactionService.getTransactionById(
      userId,
      transactionId
    );

    res.json(transaction);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Transaction not found' || error.message === 'Holding not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ message: error.message });
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
  req: Request<{ holdingId: string }, {}, {}, TransactionQueryString>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const holdingId = req.params.holdingId;
    const queryParams: TransactionQueryParams = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      type: req.query.type as 'BUY' | 'SELL' | undefined,
      sort: req.query.sort as 'date' | 'amount' | 'price' | undefined,
      order: req.query.order as 'asc' | 'desc' | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    };

    const transactions = await transactionService.getTransactionsByHolding(
      userId,
      holdingId,
      queryParams
    );

    res.json(transactions);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Holding not found') {
        res.status(404).json({ message: error.message });
      } else if (error.message === 'Unauthorized') {
        res.status(403).json({ message: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};

export const getTransactionsByPortfolio = async (
  req: Request<{ portfolioId: string }, {}, {}, TransactionQueryString>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const portfolioId = req.params.portfolioId;
    const queryParams: TransactionQueryParams = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      type: req.query.type as 'BUY' | 'SELL' | undefined,
      sort: req.query.sort as 'date' | 'amount' | 'price' | undefined,
      order: req.query.order as 'asc' | 'desc' | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined
    };

    const transactions = await transactionService.getTransactionsByPortfolio(
      userId,
      portfolioId,
      queryParams
    );

    res.json(transactions);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        res.status(403).json({ message: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};
