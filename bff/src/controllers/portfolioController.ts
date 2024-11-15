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
import * as portfolioService from '../services/portfolioService';

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
  req: AuthenticatedRequest<{ id: string }, {}, UpdatePortfolioDTO>,
  res: TypedResponse<PortfolioResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const updateData = req.body;
    
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
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<void | ErrorResponse>,
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
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<SummaryResponse | ErrorResponse>,
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
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<PerformanceResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const performance = await portfolioService.getPortfolioPerformance(portfolioId) as PerformanceData;

    if (!performance) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

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
  req: AuthenticatedRequest<{ id: string }>,
  res: TypedResponse<AllocationResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const portfolioId = req.params.id;
    const allocation = await portfolioService.getPortfolioAllocation(portfolioId) as AllocationData;

    if (!allocation) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

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
    const returns = await portfolioService.getPortfolioReturns(portfolioId) as ReturnsData;

    if (!returns) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

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
    const history = await portfolioService.getPortfolioHistory(portfolioId) as HistoryData;

    if (!history) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }

    res.json({ history });
  } catch (error) {
    next(error);
  }
};
