import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

/**
 * Only the scanner talks to the chain, so the RPC endpoint is validated here
 * rather than in `env.ts`. The API never loads this module and boots without
 * credentials it does not use.
 */
export const scannerEnv = createEnv({
  server: {
    // Carries the provider API key, so it is deployment configuration rather
    // than source. Validated here so a missing or malformed endpoint fails at
    // boot instead of on the first RPC call.
    RPC_URL: z.url(),
  },
  runtimeEnv: {
    RPC_URL: process.env.RPC_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
