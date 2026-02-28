## 01. Exploratory PoC

### Context
I started with a lean PoC to validate the event-scanning "happy path" and identify real-world RPC constraints before committing to the final architecture.

### Key Decisions

* **Infrastructure Pivot:** Initial attempts using public endpoints (`polygon-rpc.com`) failed with `401/403 Unauthorized` errors. Switched to a dedicated provider to ensure reliability.
* **Rate-Limit Discovery:** Identified a strict **10-block limit** on `eth_getLogs` for Polygon's free tier on Alchemy. This dictated the move to a more flexible RPC (Ankr) and the need for a robust batching strategy.
* **Tooling Selection:**
    * **Biome:** Faster, all-in-one toolchain for linting and formatting.
    * **Husky:** Integrated to maintain code quality and standards via git hooks.
    * **SuperJSON:** For safe `BigInt` serialization without precision loss.

### Outcome
Identified critical infrastructure bottlenecks early. The project is now ready to transition from a single-pass script to a resilient, stateful service.

### AI Support
Used AI to accelerate the debugging of RPC endpoint errors and refine technical documentation.

## 02. Scanner v1

### Context
Transitioned from the PoC script into a continuously and stateful running scanner service.

### Key Decisions

* **Scan Cursor:** Introduced a `ScanCursor` collection to persist the last scanned block per chain-contract pair. The cursor only advances after events are successfully written, making the process crash safe and idempotent on restart.
* **Idempotent Writes:** Events are persisted via `bulkWrite` with `$setOnInsert` upserts keyed on `(chainId, txHash, logIndex)`, so re-scanning a range after a crash produces no duplicates.
* **Block Range Batching:** The scanner advances in block ranges of fixed size, capped at the latest confirmed block (`latestBlock - confirmations`), to respect RPC rate limits and avoid reorg-prone data.
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
