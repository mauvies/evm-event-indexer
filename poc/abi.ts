export const FEES_COLLECTOR_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: '_token', type: 'address' },
      { indexed: true, internalType: 'address', name: '_integrator', type: 'address' },
      { indexed: false, internalType: 'uint256', name: '_integratorFee', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: '_lifiFee', type: 'uint256' },
    ],
    name: 'FeesCollected', // This is the event we are interested in
    type: 'event',
  },
] as const;
