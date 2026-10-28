# EVM Event Indexer

A service that indexes smart contract events from EVM chains into MongoDB and serves them through a REST API.

Out of the box it indexes `FeesCollected` events from the [LI.FI](https://li.fi) FeeCollector contract on Polygon, which records the fees each integrator collects per token. Chains, contracts and scan parameters live in a single config file, so pointing it at another network is a config change rather than a code change.

## Architecture

- **Scanner** — Polls the chain over JSON-RPC in fixed block ranges, persists events to MongoDB with idempotent upserts, and resumes from the last committed block on restart.
- **API** — Express server that exposes the indexed events per integrator. Query parameters are validated with Zod and pagination is cursor-based.
- **MongoDB** — Stores events and scan cursors. Compound indexes cover the API query patterns.

Scanner and API run as separate processes from the same image, so each can be deployed and restarted independently.

## Quick Start

### Configuration

Copy `.env.example` to `.env` and set `RPC_URL` to an RPC endpoint for the target chain.

| Variable    | Description                                   | Default   |
| ----------- | --------------------------------------------- | --------- |
| `RPC_URL`   | JSON-RPC endpoint, including any provider key | —         |
| `CHAIN`     | Chain to index (see `src/config/chains.ts`)   | —         |
| `MONGO_URI` | MongoDB connection string                     | —         |
| `API_PORT`  | Port the API listens on                       | `3000`    |
| `LOG_LEVEL` | Pino log level                                | `info`    |
| `NODE_ENV`  | `development`, `test` or `production`         | —         |

### Docker (recommended)

```bash
docker compose up
```

This starts MongoDB, the scanner, and the API on port `3000`.

### Local Development

Prerequisites: Node 24+, pnpm and Docker (for MongoDB).

```bash
pnpm install
pnpm db:start          # starts a local MongoDB container
pnpm dev:scanner       # run scanner service
pnpm dev:api           # run API service
```

## API

### `GET /fees-collected`

Returns the `FeesCollected` events for an integrator, newest block first.

| Parameter    | Required | Description                                |
| ------------ | -------- | ------------------------------------------ |
| `integrator` | yes      | Integrator address (0x-prefixed, 20 bytes) |
| `chainId`    | no       | Chain ID, defaults to `137` (Polygon)      |
| `fromBlock`  | no       | Lower block bound, inclusive               |
| `toBlock`    | no       | Upper block bound, inclusive               |
| `limit`      | no       | Page size, `1`–`500`, defaults to `100`    |
| `cursor`     | no       | `nextCursor` from the previous page        |

```bash
curl "http://localhost:3000/fees-collected?integrator=0xaA86522Fd61537c0fBD125f5a4e16cba3e24729f&limit=100"
```

```json
{
  "data": [
    {
      "_id": "…",
      "chainId": 137,
      "txHash": "0x…",
      "logIndex": 3,
      "blockNumber": 78600123,
      "blockHash": "0x…",
      "token": "0x0000000000000000000000000000000000000000",
      "integrator": "0xaA86522Fd61537c0fBD125f5a4e16cba3e24729f",
      "integratorFee": "1000",
      "protocolFee": "500",
      "createdAt": "…",
      "updatedAt": "…"
    }
  ],
  "meta": { "count": 1, "nextCursor": null }
}
```

Fee amounts are returned as strings to preserve `uint256` precision. `nextCursor` is `null` once the last page is reached. Invalid parameters return `400` with the validation issues.

## Adding a Chain

Add the chain to `chainKeys` and `chainIds` in `src/config/chains.constants.ts`, then its config to `src/config/chains.ts`: contract address, start block, confirmations, block range and polling intervals. Tune the block range and intervals to the RPC provider's `eth_getLogs` limits.

## Testing

The project uses Vitest with an in-memory MongoDB for database integration tests.

```bash
pnpm test              # Run all tests
```

## Design Decisions

See [DECISIONS.md](./DECISIONS.md) for the architectural choices and trade-offs behind the scanner, storage and API.
