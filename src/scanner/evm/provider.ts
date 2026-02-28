import { ethers, JsonRpcProvider } from 'ethers';

export async function createProvider(rpc: string, chainId: number): Promise<JsonRpcProvider> {
  const provider = new JsonRpcProvider(rpc, chainId, {
    staticNetwork: ethers.Network.from(chainId),
  });
  await provider.getNetwork();

  return provider;
}
