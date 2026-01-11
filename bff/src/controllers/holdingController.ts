import type { TypedResponse, NextFunction, AuthenticatedRequest } from '../types/express';
import { CreateHoldingDTO, UpdateHoldingDTO, HoldingDetails, HoldingPerformance, HoldingValue, HoldingHistory } from '../models/Holding';
import { Transaction } from '../models/Transaction';
import { holdingService } from '../services/holdingService';
import { portfolioService } from '../services/portfolioService';

// Define response types
type HoldingResponse = { holding: HoldingDetails };
type ErrorResponse = { error: string };
type PerformanceResponse = {
  performance: {
    totalReturn: number;
    percentageReturn: number;
    annualizedReturn: number;
    holdingPeriod: number;
  }
};
type TransactionsResponse = { transactions: Transaction[] };
type ValueResponse = { value: HoldingValue };
type HistoryResponse = { history: HoldingHistory[] };

export const createHolding = async (
  req: AuthenticatedRequest<{}, {}, CreateHoldingDTO>,
  res: TypedResponse<HoldingResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingData = req.body;

    // Verify user owns the target portfolio
    const portfolio = await portfolioService.getPortfolioById(holdingData.portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const holding = await holdingService.createHolding(holdingData);
    res.status(201).json({ holding });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Stock not found') {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};

export const getHolding = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<HoldingResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.id;
    const holding = await holdingService.getHoldingById(holdingId);

    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    // Verify user owns the portfolio that contains this holding
    const portfolio = await portfolioService.getPortfolioById(holding.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ holding });
  } catch (error) {
    next(error);
  }
};

export const updateHolding = async (
  req: AuthenticatedRequest<{ id: string }, {}, UpdateHoldingDTO>,
  res: TypedResponse<HoldingResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.id;
    const updateData = req.body;

    // First check if holding exists
    const existingHolding = await holdingService.getHoldingById(holdingId);
    if (!existingHolding) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    // Verify user owns the portfolio that contains this holding
    const portfolio = await portfolioService.getPortfolioById(existingHolding.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedHolding = await holdingService.updateHolding(holdingId, updateData);
    res.json({ holding: updatedHolding });
  } catch (error) {
    next(error);
  }
};

export const deleteHolding = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<void | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.id;

    // First check if holding exists
    const existingHolding = await holdingService.getHoldingById(holdingId);
    if (!existingHolding) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    // Verify user owns the portfolio that contains this holding
    const portfolio = await portfolioService.getPortfolioById(existingHolding.portfolioId);
    if (!portfolio || portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await holdingService.closeHolding(holdingId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getHoldingPerformance = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<PerformanceResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.id;

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

    const performance = await holdingService.getHoldingPerformance(holdingId);
    res.json({ performance });
  } catch (error) {
    next(error);
  }
};

export const getHoldingTransactions = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<TransactionsResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.id;

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

    const transactions = await holdingService.getHoldingTransactions(holdingId);
    res.json({ transactions });
  } catch (error) {
    next(error);
  }
};

export const getHoldingValue = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<ValueResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.id;

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

    const value = await holdingService.getHoldingValue(holdingId);
    res.json({ value });
  } catch (error) {
    next(error);
  }
};

export const getHoldingHistory = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<HistoryResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const holdingId = req.params.id;

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

    const history = await holdingService.getHoldingHistory(holdingId);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};
