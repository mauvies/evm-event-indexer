# Design Decisions

The architectural choices behind the indexer and the trade-offs that shaped them.

## Scanner

### Scan cursor
A `ScanCursor` collection persists the last scanned block per chain and contract pair. The cursor only advances after a range's events are written, so a crash at any point resumes from the last committed block without losing events.

### Idempotent writes
Events are persisted via `bulkWrite` with `$setOnInsert` upserts keyed on `(chainId, txHash, logIndex)`. Rescanning a range after a crash produces no duplicates, which is what makes the cursor-after-write ordering safe.

### Block range batching
The scanner advances in fixed-size block ranges, capped at the latest confirmed block (`latestBlock - confirmations`). Fixed ranges keep each `eth_getLogs` call within provider limits, and the confirmation depth keeps reorg-prone blocks out of the index.

### Failure handling
Each scan iteration runs inside a `try/catch`. Consecutive failures wait with exponential backoff, doubling up to a 60s cap, so a provider outage does not turn into a tight retry loop. After six consecutive failures the process exits and Docker restarts it from the last committed cursor, which is cleaner than retrying forever with possibly corrupted in-memory state.

### RPC provider
An early prototype (`poc/`) validated the scanning path against real RPC constraints before the service architecture was settled:

* Public endpoints (`polygon-rpc.com`) rejected requests with `401/403`, so a dedicated provider is required.
* Alchemy's free tier limits `eth_getLogs` on Polygon to 10 blocks per call, too narrow to backfill at a useful pace.
* Ankr's free tier allows wider ranges and roughly 1800 requests per minute.

The Polygon config is tuned to Ankr: `blockRange` 100 and `scanInterval` 200ms. With two RPC calls per iteration that uses about a third of the request budget while backfilling about 50x faster than the initial conservative settings. The endpoint itself comes from `RPC_URL`, since it carries the provider key and does not belong in the repository. Only the scanner validates it, so the API boots without RPC credentials it never uses.

### Chain config
Everything chain-specific (contract address, start block, confirmations, block range, polling intervals) lives in a central config keyed by chain. Adding a network means adding a config entry, not touching the scanner loop. `CHAIN` selects one chain per scanner process.

## Storage

### Typegoose with explicit types
Every `@prop()` declares `type: () => Number/String` explicitly, because tsx/esbuild does not support `emitDecoratorMetadata` and Typegoose cannot infer the types otherwise.

### Fee amounts as strings
`integratorFee` and `protocolFee` are `uint256` values on-chain, which exceed JavaScript's safe integer range. They are stored and returned as decimal strings so no precision is lost.

### Indexes
A unique index on `(chainId, txHash, logIndex)` backs the idempotent upserts. A compound index on `(chainId, integrator, blockNumber, _id)` covers the API's filter and sort, so queries are served from the index.

## API

### Express 5 + Zod validation
Express for its maturity, simplicity and ecosystem. All query parameters go through a Zod schema, which keeps the handler free of validation code and returns structured error messages.

### Cursor-based pagination
Skip/offset pagination slows down as collections grow, so the endpoint pages by document `_id` instead. The `_id` in the compound index also breaks ties between events in the same block, keeping page boundaries stable.

### Error handling
A global error middleware turns a `ZodError` into a `400` with the validation issues, and any other error into a generic `500`, so internal details never reach the client.

## Infrastructure

### Multi-stage Dockerfile
Four stages (`base`, `deps`, `build`, `runner`). Dev dependencies exist only in `build`; the final image carries production dependencies only and runs as the non-root `node` user.

### One image, two services
Scanner and API reuse the same image with different commands. Each service restarts independently while sharing a single build artifact.

### Compose networking and health
The compose file overrides `MONGO_URI` to use Docker's internal DNS (`mongo:27017`), so the connection string is correct regardless of the host `.env`. A `healthcheck` on Mongo with `depends_on: condition: service_healthy` makes the scanner and API wait until Mongo accepts connections, not just until its container starts.

## Testing

* **Vitest** for its native ESM support, which matches the project setup without extra configuration.
* **`mongodb-memory-server`** for integration tests against a real Mongo engine. Mocks would not catch query or index behaviour.
* **`supertest`** drives the full HTTP stack (validation, filtering, pagination), so API tests assert real responses.

Coverage focuses on the correctness guarantees: range boundaries, idempotent cursor creation and updates, and the API's filtering, pagination and error responses.

## Tooling

* **Biome** as a single fast toolchain for linting and formatting.
* **Husky** runs Biome on staged files in a pre-commit hook.
