import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';
import { chainKeysList } from './chains.constants';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']),
    LOG_LEVEL: z.string().default('info'),
    MONGO_URI: z.string().min(1),
    CHAIN: z.enum(chainKeysList),
    API_PORT: z.coerce.number().int().positive().default(3000),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL,
    MONGO_URI: process.env.MONGO_URI,
    CHAIN: process.env.CHAIN,
    API_PORT: process.env.API_PORT,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
