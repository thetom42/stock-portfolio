import type { TypedRequest, TypedResponse, NextFunction } from '../types/express';
import { stockService } from '../services/stockService';
import { Stock, StockDetails, StockSearchResult } from '../models/Stock';

// Define response types
type StockResponse = { stock: Stock };
type StocksResponse = { stocks: Stock[] };
type StockDetailsResponse = { details: StockDetails };
type ErrorResponse = { error: string };

interface CreateStockBody {
  isin: string;
  name: string;
  wkn: string;
  symbol: string;
  categoryId: string;
}

interface UpdateStockBody {
  name?: string;
  wkn?: string;
  symbol?: string;
  categoryId?: string;
}

export const getStockByIsin = async (
  req: TypedRequest<{ isin: string }>,
  res: TypedResponse<StockResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const stock = await stockService.getStockByIsin(req.params.isin);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json({ stock });
  } catch (error) {
    next(error);
  }
};

export const getStockBySymbol = async (
  req: TypedRequest<{ symbol: string }>,
  res: TypedResponse<StockResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const stock = await stockService.getStockBySymbol(req.params.symbol);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json({ stock });
  } catch (error) {
    next(error);
  }
};

export const getStockByWkn = async (
  req: TypedRequest<{ wkn: string }>,
  res: TypedResponse<StockResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const stock = await stockService.getStockByWkn(req.params.wkn);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json({ stock });
  } catch (error) {
    next(error);
  }
};

export const getAllStocks = async (
  req: TypedRequest,
  res: TypedResponse<StocksResponse>,
  next: NextFunction
) => {
  try {
    const stocks = await stockService.getAllStocks();
    res.json({ stocks });
  } catch (error) {
    next(error);
  }
};

export const getStocksByCategory = async (
  req: TypedRequest<{ categoryId: string }>,
  res: TypedResponse<StocksResponse>,
  next: NextFunction
) => {
  try {
    const stocks = await stockService.getStocksByCategory(req.params.categoryId);
    res.json({ stocks });
  } catch (error) {
    next(error);
  }
};

export const searchStocks = async (
  req: TypedRequest<{}, {}, {}, { query: string }>,
  res: TypedResponse<{ stocks: StockSearchResult[] }>,
  next: NextFunction
) => {
  try {
    const stocks = await stockService.searchStocks(req.query.query);
    res.json({ stocks });
  } catch (error) {
    next(error);
  }
};

export const getStockDetails = async (
  req: TypedRequest<{ isin: string }>,
  res: TypedResponse<StockDetailsResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const details = await stockService.getStockDetails(req.params.isin);
    if (!details) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json({ details });
  } catch (error) {
    next(error);
  }
};

export const createStock = async (
  req: TypedRequest<{}, {}, CreateStockBody>,
  res: TypedResponse<StockResponse>,
  next: NextFunction
) => {
  try {
    const stock = await stockService.createStock(
      req.body.categoryId,
      {
        isin: req.body.isin,
        name: req.body.name,
        wkn: req.body.wkn,
        symbol: req.body.symbol
      }
    );
    res.status(201).json({ stock });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (
  req: TypedRequest<{ isin: string }, {}, UpdateStockBody>,
  res: TypedResponse<StockResponse | ErrorResponse>,
  next: NextFunction
) => {
  try {
    const stock = await stockService.updateStock(req.params.isin, req.body);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json({ stock });
  } catch (error) {
    next(error);
  }
};

export const deleteStock = async (
  req: TypedRequest<{ isin: string }>,
  res: TypedResponse<void | ErrorResponse>,
  next: NextFunction
) => {
  try {
    await stockService.deleteStock(req.params.isin);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Stock not found') {
      return res.status(404).json({ error: error.message });
    }
    next(error);
  }
};
