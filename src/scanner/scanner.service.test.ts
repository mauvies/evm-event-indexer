import { describe, expect, it } from 'vitest';
import { getNextRange } from './scanner.service';

describe('getNextRange', () => {
  it('returns null when caught up to the safe head', () => {
    const nextRange = getNextRange({ lastBlock: 100, safeHeadBlock: 100, blockRange: 20 });
    expect(nextRange).toBeNull();
  });

  it('returns null when lastBlock is ahead of the safe head', () => {
    const nextRange = getNextRange({ lastBlock: 110, safeHeadBlock: 100, blockRange: 20 });
    expect(nextRange).toBeNull();
  });

  it('returns full range when lastBlock is far behind the safe head', () => {
    const nextRange = getNextRange({ lastBlock: 99, safeHeadBlock: 200, blockRange: 20 });
    expect(nextRange).toEqual({
      fromBlock: 100,
      toBlock: 119,
    });
  });

  it('set toBlock to safeHeadBlock when remaining blocks are fewer than blockRange', () => {
    const nextRange = getNextRange({ lastBlock: 95, safeHeadBlock: 100, blockRange: 20 });
    expect(nextRange).toEqual({
      fromBlock: 96,
      toBlock: 100,
    });
  });

  it('returns a single block range when only one block is available', () => {
    const nextRange = getNextRange({ lastBlock: 99, safeHeadBlock: 100, blockRange: 20 });
    expect(nextRange).toEqual({
      fromBlock: 100,
      toBlock: 100,
    });
  });
});
