import SuperJSON from 'superjson';
import { chainConfig } from './config';
import { db, persistFeeCollectedEvents } from './db';
import { createFeesCollectorContract, createProvider, prepareFeeCollectedEvent } from './utils';

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function main() {
  console.info('Initializing scanner...');

  const provider = await createProvider(chainConfig.rpc, chainConfig.chainId);
  const contract = createFeesCollectorContract(chainConfig.contractAddress, provider);
  const filter = contract.filters.FeesCollected();
  const fromBlock = chainConfig.startBlock;
  const toBlock = chainConfig.startBlock + chainConfig.blockRange;
  const eventsLogs = await contract.queryFilter(filter, fromBlock, toBlock);

  console.info(`Found ${eventsLogs.length} events from block ${fromBlock} to ${toBlock}`);

  const events = prepareFeeCollectedEvent(chainConfig.chainId, contract, eventsLogs);
  await persistFeeCollectedEvents(events);

  console.info(`Persisted ${events.length} events: ${SuperJSON.stringify(db)}`);
}
