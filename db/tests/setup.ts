import { createTestDatabase, closeDatabase } from './helpers/prisma';

beforeAll(async () => {
  try {
    await createTestDatabase();
  } catch (error) {
    console.error('Failed to create test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await closeDatabase();
  } catch (error) {
    console.error('Failed to close database connection:', error);
    throw error;
  }
});
