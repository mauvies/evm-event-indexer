import type { Contract, EventLog, Log, LogDescription } from 'ethers';
import type { FeesCollectedEvent } from '../../db/models/FeesCollectedEvent';

interface ParsedFeeCollectedEvent {
  token: string;
  integrator: string;
  integratorFee: bigint;
  protocolFee: bigint;
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
    // The contract names the protocol share `_lifiFee`; stored under a neutral name
    protocolFee: BigInt(parsed.args._lifiFee),
  };
}

export function prepareFeeCollectedEvent(
  chainId: number,
  contract: Contract,
  eventsLogs: (EventLog | Log)[],
): FeesCollectedEvent[] {
  return eventsLogs.map<FeesCollectedEvent>((log) => {
    const parsed = parseFeeCollectedEventLog(contract, log);

    return {
      chainId,
      txHash: log.transactionHash,
      logIndex: log.index,
      blockNumber: log.blockNumber,
      blockHash: log.blockHash,
      token: parsed.token,
      integrator: parsed.integrator,
      integratorFee: String(parsed.integratorFee),
      protocolFee: String(parsed.protocolFee),
    };
  });
}
