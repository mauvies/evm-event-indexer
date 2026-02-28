import { getChainConfig } from '../config/chains';
import { env } from '../config/env';
import { connectDatabase, disconnectDatabase } from '../db/connection';
import { createLogger } from '../logger';
import { createProvider } from './evm/provider';
import { scan } from './scanner.service';

const logger = createLogger('scanner');

async function run() {
  const chain = getChainConfig(env.CHAIN);

  logger.info({ chain: env.CHAIN, chainId: chain.chainId }, 'Initializing scanner');

  await connectDatabase();

  const provider = await createProvider(chain.rpcUrl, chain.chainId);

  await scan(provider, chain);
}

async function shutdown() {
  logger.info('Shutting down');
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

run().catch((err) => {
  logger.error({ err }, 'Scanner crashed');
  process.exitCode = 1;
});
