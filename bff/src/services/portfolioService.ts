import { QueryResult } from 'pg';
import { Portfolio, CreatePortfolioDTO, UpdatePortfolioDTO, PortfolioSummary, PortfolioDetails } from '../models/Portfolio';
import { query, transaction } from '../config/database';

export const createPortfolio = async (
  userId: string,
  portfolioData: CreatePortfolioDTO
): Promise<Portfolio> => {
  const result = await query<Portfolio>(
    `INSERT INTO portfolios (user_id, name, description)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, name, description, created_at, updated_at`,
    [userId, portfolioData.name, portfolioData.description]
  );

  return result.rows[0];
};

export const getPortfoliosByUserId = async (userId: string): Promise<Portfolio[]> => {
  const result = await query<Portfolio>(
    `SELECT id, user_id, name, description, created_at, updated_at
     FROM portfolios
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

export const getPortfolioById = async (
  portfolioId: string,
  userId: string
): Promise<PortfolioDetails | null> => {
  const result = await query<PortfolioDetails>(
    `SELECT p.id, p.user_id, p.name, p.description, p.created_at, p.updated_at,
            COALESCE(SUM(h.quantity * q.price), 0) as total_value,
            COALESCE(SUM(h.quantity * (q.price - h.average_cost)), 0) as total_gain_loss,
            CASE 
              WHEN SUM(h.quantity * h.average_cost) > 0 
              THEN (SUM(h.quantity * (q.price - h.average_cost)) / SUM(h.quantity * h.average_cost)) * 100
              ELSE 0
            END as total_gain_loss_percentage
     FROM portfolios p
     LEFT JOIN holdings h ON h.portfolio_id = p.id
     LEFT JOIN LATERAL (
       SELECT price 
       FROM quotes 
       WHERE stock_id = h.stock_id 
       ORDER BY timestamp DESC 
       LIMIT 1
     ) q ON true
     WHERE p.id = $1 AND p.user_id = $2
     GROUP BY p.id, p.user_id, p.name, p.description, p.created_at, p.updated_at`,
    [portfolioId, userId]
  );

  return result.rows[0] || null;
};

export const updatePortfolio = async (
  portfolioId: string,
  userId: string,
  updateData: UpdatePortfolioDTO
): Promise<Portfolio | null> => {
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updateData.name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(updateData.name);
    paramCount++;
  }

  if (updateData.description !== undefined) {
    updates.push(`description = $${paramCount}`);
    values.push(updateData.description);
    paramCount++;
  }

  if (updates.length === 0) {
    return getPortfolioById(portfolioId, userId);
  }

  values.push(portfolioId, userId);
  const result = await query<Portfolio>(
    `UPDATE portfolios
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
     RETURNING id, user_id, name, description, created_at, updated_at`,
    values
  );

  return result.rows[0] || null;
};

export const deletePortfolio = async (
  portfolioId: string,
  userId: string
): Promise<void> => {
  await transaction(async (client) => {
    // Delete all related data
    await client.query(
      'DELETE FROM transactions WHERE holding_id IN (SELECT id FROM holdings WHERE portfolio_id = $1)',
      [portfolioId]
    );
    await client.query('DELETE FROM holdings WHERE portfolio_id = $1', [portfolioId]);
    await client.query('DELETE FROM portfolios WHERE id = $1 AND user_id = $2', [
      portfolioId,
      userId,
    ]);
  });
};

export const getPortfolioSummary = async (
  portfolioId: string,
  userId: string
): Promise<PortfolioSummary | null> => {
  const result = await query<PortfolioSummary>(
    `SELECT 
       p.id,
       p.name,
       COALESCE(SUM(h.quantity * q.price), 0) as total_value,
       COALESCE(SUM(h.quantity * (q.price - h.average_cost)), 0) as total_gain_loss,
       CASE 
         WHEN SUM(h.quantity * h.average_cost) > 0 
         THEN (SUM(h.quantity * (q.price - h.average_cost)) / SUM(h.quantity * h.average_cost)) * 100
         ELSE 0
       END as total_gain_loss_percentage,
       COUNT(DISTINCT h.id) as holdings_count
     FROM portfolios p
     LEFT JOIN holdings h ON h.portfolio_id = p.id
     LEFT JOIN LATERAL (
       SELECT price 
       FROM quotes 
       WHERE stock_id = h.stock_id 
       ORDER BY timestamp DESC 
       LIMIT 1
     ) q ON true
     WHERE p.id = $1 AND p.user_id = $2
     GROUP BY p.id, p.name`,
    [portfolioId, userId]
  );

  return result.rows[0] || null;
};

export const getPortfolioPerformance = async (
  portfolioId: string,
  userId: string
) => {
  const result = await query(
    `WITH daily_values AS (
       SELECT 
         DATE_TRUNC('day', q.timestamp) as date,
         SUM(h.quantity * q.price) as value,
         SUM(h.quantity * h.average_cost) as cost
       FROM holdings h
       JOIN quotes q ON q.stock_id = h.stock_id
       WHERE h.portfolio_id = $1
       GROUP BY DATE_TRUNC('day', q.timestamp)
       ORDER BY DATE_TRUNC('day', q.timestamp)
     )
     SELECT 
       date,
       value,
       cost,
       value - cost as absolute_return,
       CASE 
         WHEN cost > 0 THEN ((value - cost) / cost) * 100
         ELSE 0
       END as percentage_return
     FROM daily_values`,
    [portfolioId]
  );

  return result.rows;
};

export const getPortfolioHoldings = async (
  portfolioId: string,
  userId: string
) => {
  const result = await query(
    `SELECT 
       h.id,
       h.stock_id,
       s.symbol,
       s.name,
       h.quantity,
       h.average_cost,
       q.price as current_price,
       h.quantity * q.price as current_value,
       (h.quantity * q.price) - (h.quantity * h.average_cost) as gain_loss,
       CASE 
         WHEN h.quantity * h.average_cost > 0 
         THEN ((h.quantity * q.price) - (h.quantity * h.average_cost)) / (h.quantity * h.average_cost) * 100
         ELSE 0
       END as gain_loss_percentage
     FROM holdings h
     JOIN stocks s ON s.id = h.stock_id
     LEFT JOIN LATERAL (
       SELECT price 
       FROM quotes 
       WHERE stock_id = h.stock_id 
       ORDER BY timestamp DESC 
       LIMIT 1
     ) q ON true
     WHERE h.portfolio_id = $1
     ORDER BY current_value DESC`,
    [portfolioId]
  );

  return result.rows;
};

export const getPortfolioAllocation = async (
  portfolioId: string,
  userId: string
) => {
  const result = await query(
    `WITH holding_values AS (
       SELECT 
         s.sector,
         SUM(h.quantity * q.price) as sector_value
       FROM holdings h
       JOIN stocks s ON s.id = h.stock_id
       LEFT JOIN LATERAL (
         SELECT price 
         FROM quotes 
         WHERE stock_id = h.stock_id 
         ORDER BY timestamp DESC 
         LIMIT 1
       ) q ON true
       WHERE h.portfolio_id = $1
       GROUP BY s.sector
     )
     SELECT 
       sector,
       sector_value,
       (sector_value / SUM(sector_value) OVER ()) * 100 as percentage
     FROM holding_values
     ORDER BY sector_value DESC`,
    [portfolioId]
  );

  return result.rows;
};

export const getPortfolioReturns = async (
  portfolioId: string,
  userId: string
) => {
  const result = await query(
    `WITH portfolio_returns AS (
       SELECT 
         'Total' as period,
         SUM(h.quantity * (q.price - h.average_cost)) as absolute_return,
         CASE 
           WHEN SUM(h.quantity * h.average_cost) > 0 
           THEN (SUM(h.quantity * (q.price - h.average_cost)) / SUM(h.quantity * h.average_cost)) * 100
           ELSE 0
         END as percentage_return
       FROM holdings h
       LEFT JOIN LATERAL (
         SELECT price 
         FROM quotes 
         WHERE stock_id = h.stock_id 
         ORDER BY timestamp DESC 
         LIMIT 1
       ) q ON true
       WHERE h.portfolio_id = $1
     )
     SELECT * FROM portfolio_returns`,
    [portfolioId]
  );

  return result.rows[0];
};

export const getPortfolioHistory = async (
  portfolioId: string,
  userId: string
) => {
  const result = await query(
    `SELECT 
       DATE_TRUNC('day', t.timestamp) as date,
       t.type,
       s.symbol,
       s.name,
       t.quantity,
       t.price,
       t.quantity * t.price as total_value
     FROM transactions t
     JOIN holdings h ON h.id = t.holding_id
     JOIN stocks s ON s.id = h.stock_id
     WHERE h.portfolio_id = $1
     ORDER BY t.timestamp DESC`,
    [portfolioId]
  );

  return result.rows;
};
