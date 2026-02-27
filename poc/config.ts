export interface ChainConfig {
  chainId: number;
  contractAddress: string;
  rpc: string;
  startBlock: number;
  blockRange: number;
}

// For now we only work with Polygon
export const chainConfig: ChainConfig = {
  chainId: 137,
  contractAddress: '0xbD6C7B0d2f68c2b7805d88388319cfB6EcB50eA9',
  rpc: 'https://rpc.ankr.com/polygon/4306d9aaf915e92fc4f6cf5217b77d6c0b20beef7a375702259bb6116919dee7',
  startBlock: 78_600_000,
  blockRange: 20,
};
