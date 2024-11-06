import { Request, Response, NextFunction } from 'express';
import { CreateHoldingDTO, UpdateHoldingDTO } from '../models/Holding';
import * as holdingService from '../services/holdingService';

export const createHolding = async (
  req: Request<{}, {}, CreateHoldingDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.id;
    const holdingData = req.body;
    const holding = await holdingService.createHolding(userId, holdingData);
    res.status(201).json(holding);
  } catch (error) {
    next(error);
  }
};

export const getHolding = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const userId = req.user!.id;
    const holding = await holdingService.getHoldingById(holdingId, userId);
    
    if (!holding) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    
    res.json(holding);
  } catch (error) {
    next(error);
  }
};

export const updateHolding = async (
  req: Request<{ id: string }, {}, UpdateHoldingDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const userId = req.user!.id;
    const updateData = req.body;
    
    const updatedHolding = await holdingService.updateHolding(
      holdingId,
      userId,
      updateData
    );
    
    if (!updatedHolding) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    
    res.json(updatedHolding);
  } catch (error) {
    next(error);
  }
};

export const deleteHolding = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const userId = req.user!.id;
    await holdingService.deleteHolding(holdingId, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getHoldingPerformance = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const userId = req.user!.id;
    const performance = await holdingService.getHoldingPerformance(holdingId, userId);
    
    if (!performance) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    
    res.json(performance);
  } catch (error) {
    next(error);
  }
};

export const getHoldingTransactions = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const userId = req.user!.id;
    const transactions = await holdingService.getHoldingTransactions(holdingId, userId);
    
    if (!transactions) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};

export const getHoldingValue = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const userId = req.user!.id;
    const value = await holdingService.getHoldingValue(holdingId, userId);
    
    if (!value) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    
    res.json(value);
  } catch (error) {
    next(error);
  }
};

export const getHoldingHistory = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const holdingId = req.params.id;
    const userId = req.user!.id;
    const history = await holdingService.getHoldingHistory(holdingId, userId);
    
    if (!history) {
      return res.status(404).json({ message: 'Holding not found' });
    }
    
    res.json(history);
  } catch (error) {
    next(error);
  }
};
