import type { Response, NextFunction } from 'express-serve-static-core';
import { CreateHoldingDTO, UpdateHoldingDTO } from '../models/Holding';
import * as holdingService from '../services/holdingService';
import { AuthenticatedRequest } from '../types/express';

export const createHolding = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const holdingData = req.body as CreateHoldingDTO;
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
  req: AuthenticatedRequest,
  res: Response,
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
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const updateData = req.body as UpdateHoldingDTO;
    
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
  req: AuthenticatedRequest,
  res: Response,
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
