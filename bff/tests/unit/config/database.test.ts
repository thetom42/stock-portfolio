import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import * as pg from 'pg';
import { environment } from '../../../src/config/environment';
import database, { getClient, query, transaction } from '../../../src/config/database';

describe('Database Configuration', () => {
  let mockPool: any;
  let mockClient: any;
  let poolStub: sinon.SinonStub;

  beforeEach(() => {
    // Create basic mock client with required methods
    mockClient = {
      query: sinon.stub().resolves({ rows: [], rowCount: 0 }),
      release: sinon.stub()
    };

    // Create basic mock pool with required methods
    mockPool = {
      connect: sinon.stub().resolves(mockClient),
      query: sinon.stub().resolves({ rows: [], rowCount: 0 }),
      end: sinon.stub().resolves(),
      on: sinon.stub(),
      emit: sinon.stub()
    };

    // Stub the Pool class
    poolStub = sinon.stub(pg, 'Pool').returns(mockPool);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Pool Configuration', () => {
    it('should configure pool with environment variables', () => {
      expect(poolStub.calledOnce).to.be.true;
      const config = poolStub.firstCall.args[0];
      expect(config).to.deep.include({
        host: environment.DB_HOST,
        port: environment.DB_PORT,
        database: environment.DB_NAME,
        user: environment.DB_USER,
        password: environment.DB_PASSWORD,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      });
    });

    it('should configure SSL when enabled', () => {
      const originalSSL = environment.DB_SSL;
      // @ts-ignore - Modifying readonly property
      environment.DB_SSL = true;

      // Create new pool to trigger configuration
      const config = poolStub.firstCall.args[0];
      expect(config.ssl).to.deep.equal({
        rejectUnauthorized: false
      });

      // @ts-ignore - Restoring readonly property
      environment.DB_SSL = originalSSL;
    });

    it('should handle pool errors', () => {
      const exitStub = sinon.stub(process, 'exit');
      const error = new Error('Test error');
      
      mockPool.emit('error', error);

      expect(exitStub.calledWith(-1)).to.be.true;
      exitStub.restore();
    });
  });

  describe('Client Management', () => {
    it('should get client from pool', async () => {
      const client = await getClient();
      expect(mockPool.connect.called).to.be.true;
      expect(client).to.exist;
      expect(client.query).to.be.a('function');
      expect(client.release).to.be.a('function');
    });

    it('should track last query on client', async () => {
      const client = await getClient();
      const queryText = 'SELECT * FROM test';
      
      await client.query(queryText);

      expect(client.lastQuery).to.equal(queryText);
    });

    it('should clear last query on release', async () => {
      const client = await getClient();
      await client.query('SELECT * FROM test');
      client.release();

      expect(client.lastQuery).to.be.undefined;
      expect(mockClient.release.called).to.be.true;
    });
  });

  describe('Query Execution', () => {
    it('should execute simple query', async () => {
      const queryText = 'SELECT * FROM test';
      await query(queryText);

      expect(mockPool.query.calledWith(queryText)).to.be.true;
    });

    it('should execute parameterized query', async () => {
      const queryText = 'SELECT * FROM test WHERE id = $1';
      const params = [1];
      await query(queryText, params);

      expect(mockPool.query.calledWith(queryText, params)).to.be.true;
    });

    it('should handle query errors', async () => {
      const error = new Error('Query error');
      mockPool.query.rejects(error);

      try {
        await query('SELECT * FROM test');
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });

    it('should log query execution time', async () => {
      const consoleLogStub = sinon.stub(console, 'log');
      const queryText = 'SELECT * FROM test';
      
      await query(queryText);

      expect(consoleLogStub.calledWith('executed query', sinon.match({
        text: queryText,
        duration: sinon.match.number,
        rows: 0
      }))).to.be.true;

      consoleLogStub.restore();
    });
  });

  describe('Transaction Management', () => {
    it('should execute successful transaction', async () => {
      mockClient.query.resolves({ rows: [], rowCount: 0 });

      const result = await transaction(async (client) => {
        await client.query('INSERT INTO test VALUES ($1)', [1]);
        await client.query('INSERT INTO test VALUES ($1)', [2]);
        return 'success';
      });

      expect(result).to.equal('success');
      expect(mockClient.query.calledWith('BEGIN')).to.be.true;
      expect(mockClient.query.calledWith('COMMIT')).to.be.true;
      expect(mockClient.release.called).to.be.true;
    });

    it('should rollback failed transaction', async () => {
      mockClient.query.resolves({ rows: [], rowCount: 0 });
      const error = new Error('Transaction error');

      try {
        await transaction(async (client) => {
          await client.query('INSERT INTO test VALUES ($1)', [1]);
          throw error;
        });
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
        expect(mockClient.query.calledWith('BEGIN')).to.be.true;
        expect(mockClient.query.calledWith('ROLLBACK')).to.be.true;
        expect(mockClient.release.called).to.be.true;
      }
    });

    it('should release client even if rollback fails', async () => {
      const rollbackError = new Error('Rollback error');
      mockClient.query.withArgs('ROLLBACK').rejects(rollbackError);

      try {
        await transaction(async () => {
          throw new Error('Transaction error');
        });
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(mockClient.release.called).to.be.true;
      }
    });

    it('should handle errors in transaction callback', async () => {
      const error = new Error('Callback error');
      mockClient.query.resolves({ rows: [], rowCount: 0 });

      try {
        await transaction(async () => {
          throw error;
        });
        expect.fail('Should have thrown an error');
      } catch (err) {
        expect(err).to.equal(error);
        expect(mockClient.query.calledWith('ROLLBACK')).to.be.true;
        expect(mockClient.release.called).to.be.true;
      }
    });
  });
});
