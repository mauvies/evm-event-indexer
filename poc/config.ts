export interface ChainConfig {
  chainId: number;
  contractAddress: string;
  rpc: string;
  startBlock: number;
  blockRange: number;
}

// This PoC is a standalone module graph: it never imports src/, so the
// validated env layer in src/config/env.ts does not apply here. Reading
// process.env directly is deliberate — pulling in that layer would force the
// PoC to define CHAIN and MONGO_URI, neither of which it uses (its "database"
// is an in-memory array).
const rpc = process.env.RPC_URL;

if (!rpc) {
  throw new Error('RPC_URL is required. Copy .env.example to .env and set it.');
}

// For now we only work with Polygon
export const chainConfig: ChainConfig = {
  chainId: 137,
  contractAddress: '0xbD6C7B0d2f68c2b7805d88388319cfB6EcB50eA9',
  rpc,
  startBlock: 78_600_000,
  blockRange: 20,
};
