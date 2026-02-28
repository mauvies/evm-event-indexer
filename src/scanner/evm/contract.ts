import { Contract, type Provider } from 'ethers';
import { FEES_COLLECTOR_ABI } from './abi';

export function createFeesCollectorContract(address: string, provider: Provider): Contract {
  return new Contract(address, FEES_COLLECTOR_ABI, provider);
}
