import type { Request, Response, NextFunction } from 'express-serve-static-core';
import * as stockService from '../services/stockService';

export const getStockByISIN = async (
  req: Request<{ isin: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const stock = await stockService.getStockByISIN(req.params.isin);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json({ stock });
  } catch (error) {
    next(error);
  }
};

export const getStockBySymbol = async (
  req: Request<{ symbol: string }>,
  res: Response,
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

export const getStockByWKN = async (
  req: Request<{ wkn: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const stock = await stockService.getStockByWKN(req.params.wkn);
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }
    res.json({ stock });
  } catch (error) {
    next(error);
  }
};

export const getAllStocks = async (
  req: Request,
  res: Response,
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
  req: Request<{ categoryId: string }>,
  res: Response,
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
  req: Request<{}, {}, {}, { query: string }>,
  res: Response,
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
  req: Request<{ isin: string }>,
  res: Response,
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
  req: Request<
    {},
    {},
    {
      isin: string;
      name: string;
      wkn: string;
      symbol: string;
      categoryId: string;
    }
  >,
  res: Response,
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
  req: Request<
    { isin: string },
    {},
    {
      name?: string;
      wkn?: string;
      symbol?: string;
      categoryId?: string;
    }
  >,
  res: Response,
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
  req: Request<{ isin: string }>,
  res: Response,
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
