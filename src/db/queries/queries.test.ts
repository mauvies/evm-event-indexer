import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { ChainConfig } from '../../config/chains';
import { ScanCursorModel } from '../models/index';
import { ensureCursor, updateCursor } from './queries';

const chain: ChainConfig = {
  chainId: 137,
  contractAddress: '0xbD6C7B0d2f68c2b7805d88388319cfB6EcB50eA9',
  startBlock: 1000,
  rpcUrl: 'https://example.com',
  confirmations: 12,
  pollInterval: 30_000,
  scanInterval: 2_000,
  blockRange: 20,
};

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await ScanCursorModel.deleteMany({});
});

describe('ensureCursor', () => {
  it('creates a new cursor with lastBlock set to startBlock - 1', async () => {
    const cursor = await ensureCursor(chain);

    expect(cursor.chainId).toBe(chain.chainId);
    expect(cursor.contractAddress).toBe(chain.contractAddress);
    expect(cursor.startBlock).toBe(chain.startBlock);
    expect(cursor.lastBlock).toBe(chain.startBlock - 1);
  });

  it('returns the existing cursor without creating a duplicate', async () => {
    await ensureCursor(chain);
    await ensureCursor(chain);

    const count = await ScanCursorModel.countDocuments();
    expect(count).toBe(1);
  });

  it('returns the persisted lastBlock when a cursor already exists', async () => {
    await ScanCursorModel.create({
      chainId: chain.chainId,
      contractAddress: chain.contractAddress,
      startBlock: chain.startBlock,
      lastBlock: 2000,
    });

    const cursor = await ensureCursor(chain);

    expect(cursor.lastBlock).toBe(2000);
  });
});

describe('updateCursor', () => {
  it('updates lastBlock in the database', async () => {
    const cursor = await ensureCursor(chain);

    cursor.lastBlock = 1050;
    await updateCursor(cursor);

    const stored = await ScanCursorModel.findOne({
      chainId: chain.chainId,
      contractAddress: chain.contractAddress,
    });

    expect(stored?.lastBlock).toBe(1050);
  });

  it('throws when the cursor does not exist', async () => {
    const cursor = {
      chainId: 999,
      contractAddress: '0x000',
      startBlock: 0,
      lastBlock: 0,
    };

    await expect(updateCursor(cursor)).rejects.toThrow();
  });
});
