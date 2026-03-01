import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { FeesCollectedEvent } from '../../db/models/FeesCollectedEvent';
import { FeesCollectedEventModel } from '../../db/models/index';
import { createApp } from '../app';

const INTEGRATOR = '0xaA86522Fd61537c0fBD125f5a4e16cba3e24729f';

function seedEvent(overrides: Partial<FeesCollectedEvent> = {}) {
  return FeesCollectedEventModel.create({
    chainId: 137,
    txHash: `0x${Math.random().toString(16).slice(2)}`,
    logIndex: 0,
    blockNumber: 100,
    blockHash: '0xblockhash',
    token: '0x0000000000000000000000000000000000000000',
    integrator: INTEGRATOR,
    integratorFee: '1000',
    lifiFee: '500',
    ...overrides,
  });
}

let mongoServer: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await FeesCollectedEventModel.deleteMany({});
});

describe('GET /fees-collected', () => {
  it('return 400 when integrator is missing', async () => {
    const res = await request(app).get('/fees-collected').query({ chainId: 137 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });

  it('return 400 when integrator address is invalid', async () => {
    const res = await request(app).get('/fees-collected').query({
      chainId: 137,
      integrator: 'abc',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('validation_error');
  });

  it('return events matching chainId and integrator', async () => {
    await seedEvent();
    await seedEvent({ integrator: '0x0000000000000000000000000000000000000001' });

    const res = await request(app).get('/fees-collected').query({
      chainId: 137,
      integrator: INTEGRATOR,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].integrator).toBe(INTEGRATOR);
    expect(res.body.meta.count).toBe(1);
  });

  it('return empty array when no events match', async () => {
    const res = await request(app).get('/fees-collected').query({
      chainId: 137,
      integrator: INTEGRATOR,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta).toEqual({ count: 0, nextCursor: null });
  });

  it('filters by fromBlock', async () => {
    await seedEvent({ blockNumber: 50 });
    await seedEvent({ blockNumber: 150 });

    const res = await request(app).get('/fees-collected').query({
      chainId: 137,
      integrator: INTEGRATOR,
      fromBlock: 100,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].blockNumber).toBe(150);
  });

  it('filters by toBlock', async () => {
    await seedEvent({ blockNumber: 50 });
    await seedEvent({ blockNumber: 150 });

    const res = await request(app).get('/fees-collected').query({
      chainId: 137,
      integrator: INTEGRATOR,
      toBlock: 100,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].blockNumber).toBe(50);
  });

  it('filters by fromBlock and toBlock combined', async () => {
    await seedEvent({ blockNumber: 50 });
    await seedEvent({ blockNumber: 150 });
    await seedEvent({ blockNumber: 250 });

    const res = await request(app).get('/fees-collected').query({
      chainId: 137,
      integrator: INTEGRATOR,
      fromBlock: 100,
      toBlock: 200,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].blockNumber).toBe(150);
  });

  it('respects the limit parameter', async () => {
    await seedEvent();
    await seedEvent();
    await seedEvent();

    const res = await request(app).get('/fees-collected').query({
      chainId: 137,
      integrator: INTEGRATOR,
      limit: 2,
    });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.nextCursor).toBeTruthy();
  });

  it('return null nextCursor when all results fit in one page', async () => {
    await seedEvent();
    await seedEvent();

    const res = await request(app).get('/fees-collected').query({
      chainId: 137,
      integrator: INTEGRATOR,
      limit: 10,
    });

    expect(res.status).toBe(200);
    expect(res.body.meta.nextCursor).toBeNull();
  });

  it('paginates with cursor', async () => {
    await seedEvent({ blockNumber: 100 });
    await seedEvent({ blockNumber: 101 });
    await seedEvent({ blockNumber: 102 });

    const page1 = await request(app).get('/fees-collected').query({
      chainId: 137,
      integrator: INTEGRATOR,
      limit: 2,
    });

    expect(page1.body.data).toHaveLength(2);
    expect(page1.body.meta.nextCursor).toBeTruthy();

    const page2 = await request(app).get('/fees-collected').query({
      chainId: 137,
      integrator: INTEGRATOR,
      limit: 2,
      cursor: page1.body.meta.nextCursor,
    });

    expect(page2.body.data).toHaveLength(1);
    expect(page2.body.meta.nextCursor).toBeNull();
  });

  it('paginates deterministically when events share the same blockNumber', async () => {
    const total = 6;

    await Promise.all(Array.from({ length: total }, () => seedEvent({ blockNumber: 100 })));

    const seen = new Set<string>();
    let cursor: string | undefined;

    while (true) {
      const res = await request(app).get('/fees-collected').query({
        chainId: 137,
        integrator: INTEGRATOR,
        limit: 2,
        cursor,
      });

      expect(res.status).toBe(200);

      for (const event of res.body.data) {
        const hasEvent = seen.has(event._id);
        expect(hasEvent).toBe(false);
        seen.add(event._id);
      }

      if (!res.body.meta.nextCursor) {
        break;
      }

      cursor = res.body.meta.nextCursor;
    }

    expect(seen.size).toBe(total);
  });
});
