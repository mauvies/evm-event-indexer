import type { AnyBulkWriteOperation } from 'mongoose';
import type { ChainConfig } from '../../config/chains';
import { createLogger } from '../../logger';
import { FeesCollectedEventModel, ScanCursorModel } from '../models';
import type { FeesCollectedEvent } from '../models/FeesCollectedEvent';
import type { ScanCursor } from '../models/ScanCursor';

const logger = createLogger('db');

export async function persistFeeCollectedEvents(events: FeesCollectedEvent[]): Promise<void> {
  const operations = events.map<AnyBulkWriteOperation<FeesCollectedEvent>>((event) => ({
    updateOne: {
      filter: {
        chainId: event.chainId,
        txHash: event.txHash,
        logIndex: event.logIndex,
      },
      update: {
        $setOnInsert: {
          chainId: event.chainId,
          txHash: event.txHash,
          logIndex: event.logIndex,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
          token: event.token,
          integrator: event.integrator,
          integratorFee: event.integratorFee,
          protocolFee: event.protocolFee,
        },
      },
      upsert: true,
    },
  }));

  await FeesCollectedEventModel.bulkWrite(operations, { ordered: false });
}

export async function ensureCursor(chain: ChainConfig): Promise<ScanCursor> {
  const existing = await ScanCursorModel.findOne({
    chainId: chain.chainId,
    contractAddress: chain.contractAddress,
  });

  if (existing) {
    logger.info(
      {
        chainId: chain.chainId,
        contractAddress: chain.contractAddress,
        lastBlock: existing.lastBlock,
      },
      'Cursor found',
    );

    return existing.toObject();
  }

  const created = await ScanCursorModel.create({
    chainId: chain.chainId,
    contractAddress: chain.contractAddress,
    startBlock: chain.startBlock,
    lastBlock: chain.startBlock - 1,
  });

  logger.info(
    {
      chainId: chain.chainId,
      contractAddress: chain.contractAddress,
      lastBlock: created.lastBlock,
    },
    'Cursor created',
  );

  return created.toObject();
}

export async function updateCursor(cursor: ScanCursor): Promise<void> {
  const updated = await ScanCursorModel.findOneAndUpdate(
    {
      chainId: cursor.chainId,
      contractAddress: cursor.contractAddress,
    },
    { lastBlock: cursor.lastBlock },
  );

  if (!updated) {
    throw new Error(
      `Cursor not found for chainId ${cursor.chainId} and contractAddress ${cursor.contractAddress}`,
    );
  }

  logger.info(
    {
      chainId: cursor.chainId,
      contractAddress: cursor.contractAddress,
      lastBlock: cursor.lastBlock,
    },
    'Cursor updated',
  );
}
