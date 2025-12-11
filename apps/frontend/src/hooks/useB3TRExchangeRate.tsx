import { useCallClause } from "@vechain/vechain-kit"
import { formatEther } from "viem"

import { getConfig } from "../../../../packages/config"

const abi = [
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "id",
        type: "bytes32",
      },
    ],
    name: "getLatestValue",
    outputs: [
      {
        internalType: "uint128",
        name: "value",
        type: "uint128",
      },
      {
        internalType: "uint128",
        name: "updatedAt",
        type: "uint128",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const
const address = getConfig().oracleContractAddress
const feedId = "0x623374722d757364000000000000000000000000000000000000000000000000" as const // b3tr-usd
const UPDATE_INTERVAL_MS = 5 * 60 * 1000 // 5 mins

export const useB3TRExchangeRate = () =>
  useCallClause({
    abi,
    address,
    method: "getLatestValue",
    args: [feedId],
    queryOptions: {
      select(data) {
        const [value, _updatedAt] = data
        return formatEther(value * 1000000n)
      },
      refetchInterval({ state }) {
        if (!state?.data) return 3_000

        const [, updatedAt] = state?.data
        const updatedAtMs = Number(updatedAt) * 1000
        const now = Date.now()
        const elapsed = now - updatedAtMs
        const nextUpdateAt =
          elapsed <= 0
            ? updatedAtMs + UPDATE_INTERVAL_MS
            : updatedAtMs + Math.ceil(elapsed / UPDATE_INTERVAL_MS) * UPDATE_INTERVAL_MS

        const timeUntilNextUpdate = nextUpdateAt - now
        const jitter = Math.floor(Math.random() * 2000)
        return Math.max(timeUntilNextUpdate + jitter, 1000)
      },
    },
  })
