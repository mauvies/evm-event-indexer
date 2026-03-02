import type { UnionToTuple } from 'type-fest';

export const chainKeys = {
  polygon: 'polygon',
} as const;

export type ChainKey = keyof typeof chainKeys;

export const chainKeysList = Object.keys(chainKeys) as UnionToTuple<keyof typeof chainKeys>;

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
    rpcUrl:
      'https://rpc.ankr.com/polygon/4306d9aaf915e92fc4f6cf5217b77d6c0b20beef7a375702259bb6116919dee7',
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
