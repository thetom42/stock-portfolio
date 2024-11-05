import { Pool, PoolClient, PoolConfig, QueryResult, QueryConfig, QueryResultRow } from 'pg';
import { environment } from './environment';

const poolConfig: PoolConfig = {
  host: environment.DB_HOST,
  port: environment.DB_PORT,
  database: environment.DB_NAME,
  user: environment.DB_USER,
  password: environment.DB_PASSWORD,
  ssl: environment.DB_SSL ? {
    rejectUnauthorized: false
  } : undefined,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
};

// Create a new pool instance
const pool = new Pool(poolConfig);

// The pool will emit an error on behalf of any idle clients
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Extended PoolClient interface to include lastQuery
interface ExtendedPoolClient extends PoolClient {
  lastQuery?: QueryConfig | string;
}

// Helper function to get a client from the pool
export const getClient = async (): Promise<ExtendedPoolClient> => {
  const client = await pool.connect() as ExtendedPoolClient;
  const query = client.query.bind(client);
  const release = client.release.bind(client);

  // Monkey patch the query method to keep track of last query
  client.query = (async (queryTextOrConfig: string | QueryConfig, values?: any[]) => {
    client.lastQuery = queryTextOrConfig;
    if (typeof queryTextOrConfig === 'string' && values) {
      return await query(queryTextOrConfig, values);
    }
    return await query(queryTextOrConfig);
  }) as typeof client.query;

  client.release = () => {
    // Clear last query before releasing
    delete client.lastQuery;
    return release();
  };

  return client;
};

// Helper function to execute a single query
export const query = async <T extends QueryResultRow = any>(
  text: string | QueryConfig,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    console.log('executed query', {
      text: typeof text === 'string' ? text : text.text,
      duration,
      rows: res.rowCount
    });
    return res;
  } catch (error) {
    console.error('Error executing query', {
      text: typeof text === 'string' ? text : text.text,
      error
    });
    throw error;
  }
};

// Helper function to execute queries within a transaction
export const transaction = async <T>(
  callback: (client: ExtendedPoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  pool,
  getClient,
  query,
  transaction
};
