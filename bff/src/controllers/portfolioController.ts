import { Request, Response, NextFunction } from 'express';
import { Portfolio, CreatePortfolioDTO, UpdatePortfolioDTO } from '../models/Portfolio';
import * as portfolioService from '../services/portfolioService';
import { AuthenticatedRequest } from '../types/express';

export const createPortfolio = async (
  req: AuthenticatedRequest & { body: CreatePortfolioDTO },
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const portfolioData = req.body;
    const portfolio = await portfolioService.createPortfolio(userId, portfolioData);
    res.status(201).json(portfolio);
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
    res.json(portfolios);
  } catch (error) {
    next(error);
  }
};

export const getPortfolio = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const portfolio = await portfolioService.getPortfolioById(portfolioId, userId);
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.json(portfolio);
  } catch (error) {
    next(error);
  }
};

export const updatePortfolio = async (
  req: AuthenticatedRequest & { params: { id: string }, body: UpdatePortfolioDTO },
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const updateData = req.body;
    
    const updatedPortfolio = await portfolioService.updatePortfolio(
      portfolioId,
      userId,
      updateData
    );
    
    if (!updatedPortfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.json(updatedPortfolio);
  } catch (error) {
    next(error);
  }
};

export const deletePortfolio = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    await portfolioService.deletePortfolio(portfolioId, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getPortfolioSummary = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const summary = await portfolioService.getPortfolioSummary(portfolioId, userId);
    
    if (!summary) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.json(summary);
  } catch (error) {
    next(error);
  }
};

export const getPortfolioPerformance = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const performance = await portfolioService.getPortfolioPerformance(portfolioId, userId);
    
    if (!performance) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.json(performance);
  } catch (error) {
    next(error);
  }
};

export const getPortfolioHoldings = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const holdings = await portfolioService.getPortfolioHoldings(portfolioId, userId);
    
    if (!holdings) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.json(holdings);
  } catch (error) {
    next(error);
  }
};

export const getPortfolioAllocation = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const allocation = await portfolioService.getPortfolioAllocation(portfolioId, userId);
    
    if (!allocation) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.json(allocation);
  } catch (error) {
    next(error);
  }
};

export const getPortfolioReturns = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const returns = await portfolioService.getPortfolioReturns(portfolioId, userId);
    
    if (!returns) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.json(returns);
  } catch (error) {
    next(error);
  }
};

export const getPortfolioHistory = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const history = await portfolioService.getPortfolioHistory(portfolioId, userId);
    
    if (!history) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    
    res.json(history);
  } catch (error) {
    next(error);
  }
};
