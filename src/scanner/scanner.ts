import { getChainConfig } from '../config/chains';
import { env } from '../config/env';
import { connectDatabase } from '../db/connection';
import { createLogger } from '../logger';
import { createProvider } from './evm/provider';
import { runScanner } from './scanner.service';

const logger = createLogger('scanner');

async function main() {
  const chain = getChainConfig(env.CHAIN);

  logger.info({ chain: env.CHAIN, chainId: chain.chainId }, 'Initializing scanner');

  await connectDatabase();

  const provider = await createProvider(chain.rpcUrl, chain.chainId);

  await runScanner(provider, chain);
}

main().catch((err) => {
  logger.error({ err }, 'Scanner crashed');
  process.exitCode = 1;
});
