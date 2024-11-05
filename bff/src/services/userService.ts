import { QueryResult } from 'pg';
import { User, CreateUserDTO, UpdateUserDTO } from '../models/User';
import { query, transaction } from '../config/database';

export const createUser = async (userData: CreateUserDTO): Promise<User> => {
  const result = await query<User>(
    `INSERT INTO users (email, first_name, last_name, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, email, first_name, last_name, created_at, updated_at`,
    [userData.email, userData.firstName, userData.lastName, userData.password] // Note: In real implementation, password should be hashed
  );

  return result.rows[0];
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const result = await query<User>(
    `SELECT id, email, first_name, last_name, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [userId]
  );

  return result.rows[0] || null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const result = await query<User>(
    `SELECT id, email, first_name, last_name, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  return result.rows[0] || null;
};

export const updateUser = async (
  userId: string,
  updateData: UpdateUserDTO
): Promise<User | null> => {
  // Build dynamic update query based on provided fields
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (updateData.email !== undefined) {
    updates.push(`email = $${paramCount}`);
    values.push(updateData.email);
    paramCount++;
  }

  if (updateData.firstName !== undefined) {
    updates.push(`first_name = $${paramCount}`);
    values.push(updateData.firstName);
    paramCount++;
  }

  if (updateData.lastName !== undefined) {
    updates.push(`last_name = $${paramCount}`);
    values.push(updateData.lastName);
    paramCount++;
  }

  if (updates.length === 0) {
    return getUserById(userId);
  }

  values.push(userId);
  const result = await query<User>(
    `UPDATE users
     SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${paramCount}
     RETURNING id, email, first_name, last_name, created_at, updated_at`,
    values
  );

  return result.rows[0] || null;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await transaction(async (client) => {
    // Delete all user-related data
    await client.query('DELETE FROM transactions WHERE holding_id IN (SELECT id FROM holdings WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = $1))', [userId]);
    await client.query('DELETE FROM holdings WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = $1)', [userId]);
    await client.query('DELETE FROM portfolios WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
  });
};

export const validateUserCredentials = async (
  email: string,
  password: string
): Promise<User | null> => {
  const result = await query<User & { password_hash: string }>(
    `SELECT id, email, first_name, last_name, password_hash, created_at, updated_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    return null;
  }

  // Note: In real implementation, should use proper password comparison
  if (password !== user.password_hash) {
    return null;
  }

  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
