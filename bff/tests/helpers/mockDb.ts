import { QueryResult } from 'pg';
import sinon from 'sinon';
import { QueryResultRow } from 'pg';

// Mock database responses
export const mockQueryResult = <T extends QueryResultRow>(rows: T[]): QueryResult<T> => ({
  rows,
  command: '',
  rowCount: rows.length,
  oid: 0,
  fields: []
});

// Create stub functions
export const mockQuery = sinon.stub();
export const mockTransaction = sinon.stub();

// Reset all stubs between tests
export const resetMocks = () => {
  mockQuery.reset();
  mockTransaction.reset();
};

// Mock database module
export const dbMock = {
  query: mockQuery,
  transaction: mockTransaction
};
