import type { ChainKey } from './chains.constants';
import { scannerEnv } from './scanner.env';

export { type ChainKey, chainKeys, chainKeysList } from './chains.constants';

export interface ChainConfig {
  chainId: number;
  rpcUrl: string;
  contractAddress: string;
  confirmations: number;
  pollInterval: number;
  scanInterval: number;
  blockRange: number;
  startBlock: number;
}

export const chains = {
  polygon: {
    chainId: 137,
    // Supplied per deployment: the endpoint carries an API key and must not
    // live in the repository. A single RPC_URL is enough because CHAIN selects
    // one chain per scanner process.
    rpcUrl: scannerEnv.RPC_URL,
    contractAddress: '0xbD6C7B0d2f68c2b7805d88388319cfB6EcB50eA9',
    confirmations: 12,

    // Based on rate limits set by Ankr for their free tier
    pollInterval: 30_000,
    scanInterval: 200,
    blockRange: 100,

    startBlock: 78_600_000,
  },
} satisfies Record<ChainKey, ChainConfig>;

export function getChainConfig(key: ChainKey): ChainConfig {
  return chains[key];
}
