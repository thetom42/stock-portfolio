import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { PrismaClient } from '@prisma/client';
import * as database from '../../../src/utils/database';

use(chaiAsPromised);

describe('Database Utils', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getPrismaClient', () => {
    it('should create a new PrismaClient instance if none exists', () => {
      const client = database.getPrismaClient();
      expect(client).to.be.instanceOf(PrismaClient);
    });

    it('should return the same instance on subsequent calls', () => {
      const firstClient = database.getPrismaClient();
      const secondClient = database.getPrismaClient();
      expect(firstClient).to.equal(secondClient);
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect and clear the PrismaClient instance', async () => {
      const client = database.getPrismaClient();
      const disconnectSpy = sinon.spy(client, '$disconnect');
      
      await database.disconnectDatabase();
      
      expect(disconnectSpy.calledOnce).to.be.true;
      
      // Get a new client to verify the old one was cleared
      const newClient = database.getPrismaClient();
      expect(newClient).to.not.equal(client);
    });

    it('should handle case when no client exists', async () => {
      // Force client to be null
      await database.disconnectDatabase();
      // Should not throw when called again
      await expect(database.disconnectDatabase()).to.be.fulfilled;
    });
  });
});
