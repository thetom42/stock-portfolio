import type { Response, NextFunction } from 'express-serve-static-core';
import { CreatePortfolioDTO, UpdatePortfolioDTO } from '../models/Portfolio';
import * as portfolioService from '../services/portfolioService';
import { AuthenticatedRequest } from '../types/express';

export const createPortfolio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const portfolioData = req.body as CreatePortfolioDTO;
    const portfolio = await portfolioService.createPortfolio(userId, portfolioData);
    res.status(201).json({ portfolio });
  } catch (error) {
    next(error);
  }
};

export const getUserPortfolios = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const portfolios = await portfolioService.getPortfoliosByUserId(userId);
    res.json({ portfolios });
  } catch (error) {
    next(error);
  }
};

export const getPortfolio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    res.json({ portfolio });
  } catch (error) {
    next(error);
  }
};

export const updatePortfolio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const updateData = req.body as UpdatePortfolioDTO;
    
    const updatedPortfolio = await portfolioService.updatePortfolio(portfolioId, updateData);
    
    if (!updatedPortfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    res.json({ portfolio: updatedPortfolio });
  } catch (error) {
    next(error);
  }
};

export const deletePortfolio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    await portfolioService.deletePortfolio(portfolioId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Portfolio not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};

export const getPortfolioSummary = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const summary = await portfolioService.getPortfolioSummary(portfolioId);

    if (!summary) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({ summary });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioPerformance = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const performance = await portfolioService.getPortfolioPerformance(portfolioId);

    if (!performance) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({ performance });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioHoldings = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const holdings = await portfolioService.getPortfolioHoldings(portfolioId);

    if (!holdings) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({ holdings });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioAllocation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const allocation = await portfolioService.getPortfolioAllocation(portfolioId);

    if (!allocation) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({ allocation });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioReturns = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const returns = await portfolioService.getPortfolioReturns(portfolioId);

    if (!returns) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({ returns });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioHistory = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const history = await portfolioService.getPortfolioHistory(portfolioId);

    if (!history) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({ history });
  } catch (error) {
    next(error);
  }
};
