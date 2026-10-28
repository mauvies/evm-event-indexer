export interface FeeCollectedEvent {
  chainId: number;
  txHash: string;
  logIndex: number;
  blockNumber: number;
  blockHash: string;
  token: string;
  integrator: string;
  integratorFee: bigint;
  protocolFee: bigint;
}

export const db: FeeCollectedEvent[] = [];

export async function persistFeeCollectedEvents(events: FeeCollectedEvent[]) {
  return new Promise((resolve) => {
    setTimeout(() => {
      db.push(...events);
      resolve(true);
    }, 500);
  });
}
