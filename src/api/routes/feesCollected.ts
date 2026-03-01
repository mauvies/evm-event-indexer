import { isAddress } from 'ethers';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';
import { chains } from '../../config/chains.js';
import { FeesCollectedEventModel } from '../../db/models/index.js';

const querySchema = z.object({
  chainId: z.coerce.number().int().positive().default(chains.polygon.chainId),
  integrator: z.custom<string>(
    (val) => typeof val === 'string' && isAddress(val),
    'Invalid address. Must be 0x-prefixed 20 bytes hex string.',
  ),
  fromBlock: z.coerce.number().int().nonnegative().optional(),
  toBlock: z.coerce.number().int().nonnegative().optional(),
  // Pagination
  limit: z.coerce.number().int().positive().max(500).default(100),
  cursor: z.string().optional(),
});

export const getFeesCollectedEvents: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const query = querySchema.parse(req.query);

    const filter: Record<string, unknown> = {
      chainId: query.chainId,
      integrator: query.integrator,
    };

    if (query.fromBlock !== undefined || query.toBlock !== undefined) {
      filter.blockNumber = {
        ...(query.fromBlock !== undefined ? { $gte: query.fromBlock } : {}),
        ...(query.toBlock !== undefined ? { $lte: query.toBlock } : {}),
      };
    }

    if (query.cursor !== undefined) {
      filter._id = { $lt: query.cursor };
    }

    const data = await FeesCollectedEventModel.find(filter)
      // Sort by chainId, integrator, blockNumber descending and _id descending
      .sort({ chainId: 1, integrator: 1, blockNumber: -1, _id: -1 })
      .limit(query.limit)
      .lean();

    // Get the next cursor from the last document _id in the page
    const nextCursor = data.length === query.limit ? String(data[data.length - 1]._id) : null;

    res.json({
      data,
      meta: {
        count: data.length,
        nextCursor,
      },
    });
  } catch (err) {
    next(err);
  }
};
