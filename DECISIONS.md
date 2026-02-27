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