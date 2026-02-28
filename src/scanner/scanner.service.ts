import type { JsonRpcProvider } from 'ethers';
import type { ChainConfig } from '../config/chains';
import { ensureCursor, persistFeeCollectedEvents, updateCursor } from '../db/queries/queries';
import { createLogger } from '../logger';
import { sleep } from '../utils';
import { createFeesCollectorContract } from './evm/contract';
import { prepareFeeCollectedEvent } from './evm/events';

const logger = createLogger('scanner');

export async function runScanner(provider: JsonRpcProvider, chain: ChainConfig): Promise<void> {
  const contract = createFeesCollectorContract(chain.contractAddress, provider);

  // Get the last block scanned from the database
  const cursor = await ensureCursor(chain);

  logger.info(
    {
      chainId: chain.chainId,
      contractAddress: chain.contractAddress,
      startBlock: chain.startBlock,
      lastBlock: cursor.lastBlock,
    },
    'Scanner starting',
  );

  const eventFilter = contract.filters.FeesCollected();

  while (true) {
    const latestBlock = await provider.getBlockNumber();
    const safeHeadBlock = latestBlock - chain.confirmations;

    const nextRange = getNextRange({
      lastBlock: cursor.lastBlock,
      safeHeadBlock,
      blockRange: chain.blockRange,
    });

    if (!nextRange) {
      // Wait until there is a valid range to scan
      await sleep(chain.pollInterval);
      continue;
    }

    const logs = await contract.queryFilter(eventFilter, nextRange.fromBlock, nextRange.toBlock);

    if (logs.length > 0) {
      const events = prepareFeeCollectedEvent(chain.chainId, contract, logs);
      await persistFeeCollectedEvents(events);
    }

    logger.info({ ...nextRange, found: logs.length, safeHeadBlock, latestBlock }, 'Range scanned');

    // Only move the cursor after the range is successfully persisted
    cursor.lastBlock = nextRange.toBlock;
    await updateCursor(cursor);

    // To avoid hammering the RPC (rate limits, connection drops)
    await sleep(chain.scanInterval);
  }
}

interface NextRangeParams {
  lastBlock: number;
  safeHeadBlock: number;
  blockRange: number;
}

interface NextRange {
  fromBlock: number;
  toBlock: number;
}

export function getNextRange({
  lastBlock,
  safeHeadBlock,
  blockRange,
}: NextRangeParams): NextRange | null {
  const fromBlock = lastBlock + 1;

  if (fromBlock > safeHeadBlock) {
    return null;
  }

  const toBlock = Math.min(fromBlock + blockRange - 1, safeHeadBlock);

  return { fromBlock, toBlock };
}
