import type { TypedResponse, NextFunction, AuthenticatedRequest } from '../types/express';
import {
  CreatePortfolioDTO,
  UpdatePortfolioDTO,
  PortfolioResponse,
  PortfoliosResponse,
  SummaryResponse,
  PerformanceResponse,
  HoldingsResponse,
  AllocationResponse,
  ReturnsResponse,
  HistoryResponse,
  ErrorResponse,
  PerformanceData,
  AllocationData,
  ReturnsData,
  HistoryData
} from '../models/Portfolio';
import { portfolioService } from '../services/portfolioService';

export const createPortfolio = async (
  req: AuthenticatedRequest<{}, {}, CreatePortfolioDTO>,
  res: TypedResponse<PortfolioResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const portfolioData = req.body;
    const portfolio = await portfolioService.createPortfolio(userId, portfolioData);
    res.status(201).json({ portfolio });
  } catch (error) {
    next(error);
  }
};

export const getUserPortfolios = async (
  req: AuthenticatedRequest,
  res: TypedResponse<PortfoliosResponse>,
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
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<PortfolioResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const portfolio = await portfolioService.getPortfolioById(portfolioId);

    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ portfolio });
  } catch (error) {
    next(error);
  }
};

export const updatePortfolio = async (
  req: AuthenticatedRequest<{ id: string }, {}, UpdatePortfolioDTO>,
  res: TypedResponse<PortfolioResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;
    const updateData = req.body;

    // First check ownership before updating
    const existingPortfolio = await portfolioService.getPortfolioById(portfolioId);
    if (!existingPortfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (existingPortfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updatedPortfolio = await portfolioService.updatePortfolio(portfolioId, updateData);
    res.json({ portfolio: updatedPortfolio });
  } catch (error) {
    next(error);
  }
};

export const deletePortfolio = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<void | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;

    // First check ownership before deleting
    const existingPortfolio = await portfolioService.getPortfolioById(portfolioId);
    if (!existingPortfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (existingPortfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await portfolioService.deletePortfolio(portfolioId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getPortfolioSummary = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<SummaryResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;

    // First check ownership
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const summary = await portfolioService.getPortfolioSummary(portfolioId);
    res.json({ summary });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioPerformance = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<PerformanceResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;

    // First check ownership
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const performance = await portfolioService.getPortfolioPerformance(portfolioId) as PerformanceData;
    res.json({ performance });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioHoldings = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<HoldingsResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;

    // First check ownership
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const holdings = await portfolioService.getPortfolioHoldings(portfolioId);
    res.json({ holdings });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioAllocation = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<AllocationResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;

    // First check ownership
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const allocation = await portfolioService.getPortfolioAllocation(portfolioId) as AllocationData;
    res.json({ allocation });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioReturns = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<ReturnsResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;

    // First check ownership
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const returns = await portfolioService.getPortfolioReturns(portfolioId) as ReturnsData;
    res.json({ returns });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioHistory = async (
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<HistoryResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const userId = req.user.id;

    // First check ownership
    const portfolio = await portfolioService.getPortfolioById(portfolioId);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    // Ownership check
    if (portfolio.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const history = await portfolioService.getPortfolioHistory(portfolioId) as HistoryData;
    res.json({ history });
  } catch (error) {
    next(error);
  }
};
