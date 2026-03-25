/**
 * Minimal ABI for RelayerRewardsPool contract functions used by the frontend.
 * The full ABI is in @vechain/vebetterdao-contracts >= 8.4.0.
 * We define a minimal subset here to avoid requiring a contracts package upgrade.
 */
export const relayerRewardsPoolAbi = [
  {
    inputs: [{ internalType: "address", name: "relayer", type: "address" }],
    name: "setPreferredRelayer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getPreferredRelayer",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRegisteredRelayers",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const
