# LI.FI Fees

Indexes `FeesCollected` events from the Li.Fi FeeCollector contract and exposes them through a REST API.

## Architecture

- **Scanner** — Continuously polls the chain via RPC, persists events to MongoDB, and resumes from the last committed block on restart.
- **API** — Express server that exposes an endpoint for querying `FeesCollected` events for a given integrator. Query parameters ara validated with Zod and pagination is cursor-based.
- **MongoDB** — Stores events and scan cursors. Compound indexes cover the API query patterns.

## Quick Start

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

## Testing

The project uses vitest with an in-memory MongoDB for database integration tests.

```bash
pnpm test              # Run all tests
```

## Design Decisions

See [DECISIONS.md](./DECISIONS.md) for a detailed log of architectural choices and trade-offs made throughout the project.
