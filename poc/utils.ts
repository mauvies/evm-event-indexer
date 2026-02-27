import {
  Contract,
  type EventLog,
  ethers,
  JsonRpcProvider,
  type Log,
  type LogDescription,
  type Provider,
} from 'ethers';
import { FEES_COLLECTOR_ABI } from './abi';
import type { FeeCollectedEvent } from './db';

export async function createProvider(rpc: string, chainId: number): Promise<JsonRpcProvider> {
  const provider = new JsonRpcProvider(rpc, chainId, {
    staticNetwork: ethers.Network.from(chainId),
  });
  await provider.getNetwork();

  return provider;
}

export function createFeesCollectorContract(address: string, provider: Provider): Contract {
  return new Contract(address, FEES_COLLECTOR_ABI, provider);
}

interface ParsedFeeCollectedEvent {
  token: string;
  integrator: string;
  integratorFee: bigint;
  lifiFee: bigint;
}

export function parseFeeCollectedEventLog(
  contract: Contract,
  log: EventLog | Log,
): ParsedFeeCollectedEvent {
  const parsed = contract.interface.parseLog(log) as LogDescription;

  if (parsed === null || parsed.name !== 'FeesCollected') {
    throw new Error(`Failed to parse log: ${log.index}`);
  }

  // Accessing args by name as defined in the ABI
  return {
    token: parsed.args._token as string,
    integrator: parsed.args._integrator as string,
    integratorFee: BigInt(parsed.args._integratorFee),
    lifiFee: BigInt(parsed.args._lifiFee),
  };
}

export function prepareFeeCollectedEvent(
  chainId: number,
  contract: Contract,
  eventsLogs: (EventLog | Log)[],
): FeeCollectedEvent[] {
  return eventsLogs.map<FeeCollectedEvent>((log) => {
    const parsed = parseFeeCollectedEventLog(contract, log);

    return {
      chainId,
      txHash: log.transactionHash,
      logIndex: log.index,
      blockNumber: log.blockNumber,
      blockHash: log.blockHash,
      ...parsed,
    };
  });
}
