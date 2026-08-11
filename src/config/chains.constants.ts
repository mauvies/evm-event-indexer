import type { UnionToTuple } from 'type-fest';

/**
 * Kept separate from `chains.ts` so `env.ts` can validate `CHAIN` against this
 * list without importing the chain configs, which now depend on `env` for the
 * RPC URL. Keeping them in one file would create an import cycle.
 */
export const chainKeys = {
  polygon: 'polygon',
} as const;

export type ChainKey = keyof typeof chainKeys;

export const chainKeysList = Object.keys(chainKeys) as UnionToTuple<keyof typeof chainKeys>;

/**
 * Exposed separately so consumers that only need an identifier — the API, for
 * instance — do not pull in the chain configs and therefore do not require the
 * RPC credentials they never use.
 */
export const chainIds = {
  polygon: 137,
} as const satisfies Record<ChainKey, number>;
