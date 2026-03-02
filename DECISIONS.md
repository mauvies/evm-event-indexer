## 01. Exploratory PoC

### Context
I started with a lean PoC to validate the event scanning "happy path" and identify real world RPC constraints before committing to the final architecture.

### Key Decisions

* **Infrastructure Pivot:** Initial attempts using public endpoints (`polygon-rpc.com`) failed with `401/403 Unauthorized` errors, so I switched to a dedicated provider to ensure reliability.
* **Rate-Limit Discovery:** Identified a strict **10-block limit** on `eth_getLogs` for Polygon's free tier on Alchemy. This dictated the move to a more flexible RPC (Ankr) and the need for a robust batching strategy.
* **Tooling Selection:**
    * **Biome:** Faster, all-in-one toolchain for linting and formatting.
    * **Husky:** Integrated to maintain code quality and standards via git hooks.
    * **Superjson:** For safe `BigInt` serialization without precision loss.

### Outcome
Identified critical infrastructure bottlenecks early. The project is now ready to transition from a happy path script to a robust, stateful service.

### AI Support
Used AI to accelerate the debugging of RPC endpoint errors and refine the technical documentation format.

## 02. Scanner v1

### Context
Transitioned from the PoC script into a continuously and stateful running scanner service.

### Key Decisions

* **Scan Cursor:** Introduced a `ScanCursor` collection to persist the last scanned block per chain-contract pair. The cursor only advances after events are successfully written, making the process crash safe and idempotent on restart.
* **Idempotent Writes:** Events are persisted via `bulkWrite` with `$setOnInsert` upserts keyed on `(chainId, txHash, logIndex)`, so rescanning a range after a crash produces no duplicates.
* **Block Range Batching:** The scanner advances in block ranges of fixed size, capped at the latest confirmed block (`latestBlock - confirmations`), to respect RPC rate limits and avoid reorg prone data.
* **MongoDB in Docker:** Local development uses a single `docker run` command (`pnpm start:db`) to spin up a Mongo instance, keeping the setup zero-config.
* **Chain Config:** I moved all the chain specific stuff (like RPC, batch sizes, and start blocks) into a central config. This makes it super easy to plug in a new network without touching the core scanner logic.
* **Typegoose with Explicit Types:** Had to add explicit `type: () => Number/String` to all `@prop()` decorators to work around tsx/esbuild not supporting `emitDecoratorMetadata`.

### Outcome
A first working version that scans, persists, and resumes reliably. Still needs hardening for production and test coverage, which is the next step.

### AI Support
Used for fixing the tsx/decorator metadata incompatibility and build the desired MongoDB queries.

## 03. Scanner v1 Tests

### Context
Added the first test suite covering the two core pieces of logic: block range calculation and scan cursor handling.

### Key Decisions

* **Vitest:** Chosen for its native ESM support, which matched the project setup without extra configuration.
* **`mongodb-memory-server`:** Used for cursor integration tests, avoiding mocks that wouldn't catch actual query or index behaviour.
* **Test scope:** Focused on `getNextRange` (pure unit tests, no dependencies) and the cursor functions `ensureCursor`/`updateCursor` (integration tests against the in-memory DB).

### Outcome
Tests covering the critical correctness guarantees: range boundary logic, idempotent cursor creation, and update behaviour.

### AI Support
Used AI to set up the `mongodb-memory-server` integration and wire it correctly with Mongoose and Typegoose in the test environment.

## 04. Dockerize scanner service

### Context
Containerized the scanner so it can run alongside MongoDB with a single `docker compose up` command.

### Key Decisions

* **Multi-stage Dockerfile:** Uses four stages (`base`, `deps`, `build`, `runner`). Dev dependencies are only present during `build`; the final image installs only production deps for a smaller footprint.
* **Non-root user:** The runner stage switches to `USER node` to follow container security best practices.

### Outcome
Full local stack in one command. The same image can be deployed to production with only environment variable changes.

## 05. API v1

### Context
With the scanner persisting events into MongoDB, the next step was exposing that data through a REST API so integrators can query their fee collection history.

### Key Decisions

* **Express 5 + Zod Validation:** Chose Express for its maturity, simplicity and ecosystem. All query parameters are validated through a Zod schema, which keeps the handler clean and returns structured error messages.
* **Cursor Based Pagination:** Instead of skip/offset pagination (which gets slower with large collections), the endpoint uses the document `_id` as a reference for the cursor. The compound index `(chainId, integrator, blockNumber, _id)` covers both the filter and the sort, so the query can be processed from the index alone.
* **Error Handling:** A global error middleware catches `ZodError` and returns a `400` with the validation issues, while any unexpected error becomes a generic `500`. This avoids leaking internal details to the client.
* **Integration Tests:** Tests run against `mongodb-memory-server` and covers the entire HTTP stack (validation, filtering, pagination) through `supertest`. No mocks, so the assertions reflect real Mongo behaviour.

### Outcome
An API that integrators can call to retrieve their fee events with filtering by block range, validation, and efficient pagination. Test coverage gives confidence that the query logic, edge cases, and error responses work as expected.

### AI Support
Used AI to validate the pagination approach, clean up the error handling with `createHttpLogger`, and return clear Zod validation errors.

## 06. Dockerize API v1

### Context
Use the existing Docker Compose setup to include the API service, so the full stack (database, scanner, API) run with a single command.

### Key Decisions

* **Same image, different command:** Both `scanner` and `api` services reuse the same Dockerfile.
* **Internal Mongo URI:** The compose environment overrides `MONGO_URI` to use Docker's internal DNS `mongo:27017`, so the connection string is correct regardless of the host `.env`.

### Outcome
Full local stack (database, scanner, API) in one `docker compose up`. Each service is independently restartable and shares the same build artifact.

## 07. Overall improvemnts

### Context
The scanner main loop had no error handling, so a single RPC error would crash the process. Also, the scan interval and block range were very conservative relative to the Ankr rate limits.

### Key Decisions

* **Exponential Backoff on Failure:** Added a `try/catch` around the scan loop body with an `exponentialBackoff` utility that increases wait times from 1s up to 60s across consecutive failures. After `maxRetries` is reached the function throws, crashing the process so Docker can restart it cleanly from the last committed cursor.
* **Tuned Chain Config for Ankr:** Adjusted `scanInterval` from `2000ms` to `200ms` and `blockRange` from `20` to `100`. With Ankr's guaranteed ~1800 reqs/min (~30 reqs/sec) and 2 RPC calls per iteration, this uses roughly a third of the budget while scanning ~50x faster.
* **Mongo Healthcheck:** Added a `healthcheck` to the Mongo service with `depends_on: condition: service_healthy` on both `scanner` and `api`. Previously, `depends_on` only waited for the container to start, not for Mongo to accept connections.

### Outcome
The scanner now handles RPC errors automatically. If the provider goes down, the system waits and retries using a backoff strategy. Catching up with old blocks is also much faster because the rate-limit settings are now optimized.
