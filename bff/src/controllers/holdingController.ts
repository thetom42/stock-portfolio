import type { TypedResponse, NextFunction, AuthenticatedRequest } from '../types/express';
import { CreateHoldingDTO, UpdateHoldingDTO } from '../models/Holding';
import * as holdingService from '../services/holdingService';

// Define response types
type HoldingResponse = { holding: any }; // TODO: Replace 'any' with proper Holding type
type ErrorResponse = { error: string };
type PerformanceResponse = { performance: any }; // TODO: Replace 'any' with proper Performance type
type TransactionsResponse = { transactions: any[] }; // TODO: Replace 'any' with proper Transaction type
interface HoldingValue {
  currentValue: number;
  costBasis: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercentage: number;
}
type ValueResponse = { value: HoldingValue };
type HistoryResponse = { history: any[] }; // TODO: Replace 'any' with proper History type

export const createHolding = async (
  req: AuthenticatedRequest<{}, {}, CreateHoldingDTO>,
  res: TypedResponse<HoldingResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const holdingData = req.body;
    const holding = await holdingService.createHolding(holdingData);
    res.status(201).json({ holding });
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

export const getHolding = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<HoldingResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const holding = await holdingService.getHoldingById(holdingId);
    
    if (!holding) {
      return res.status(404).json({ error: 'Holding not found' });
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
    const holdingId = req.params.id;
    const updateData = req.body;
    
    const updatedHolding = await holdingService.updateHolding(holdingId, updateData);
    res.json({ holding: updatedHolding });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Holding not found') {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};

export const deleteHolding = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<void | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    await holdingService.closeHolding(holdingId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Holding not found') {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};

export const getHoldingPerformance = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<PerformanceResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const performance = await holdingService.getHoldingPerformance(holdingId);
    res.json({ performance });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Holding not found') {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};

export const getHoldingTransactions = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<TransactionsResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const transactions = await holdingService.getHoldingTransactions(holdingId);
    res.json({ transactions });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Holding not found') {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};

export const getHoldingValue = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<ValueResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const value = await holdingService.getHoldingValue(holdingId);
    res.json({ value });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Holding not found') {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};

export const getHoldingHistory = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<HistoryResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const history = await holdingService.getHoldingHistory(holdingId);
    res.json({ history });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Holding not found') {
        res.status(404).json({ error: error.message });
      } else {
        next(error);
      }
    } else {
      next(error);
    }
  }
};
