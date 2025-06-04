import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { getXAppRoundEarningsQueryKey } from "./useXAppRoundEarnings"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts/typechain-types"
import { ethers } from "ethers"
import { queryClient } from "@/api/QueryProvider"

const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress

export const getXAppTotalEarningsClauses = (roundIds: number[], app: string) => {
  const contract = XAllocationPool__factory.createInterface()

  const clauses = roundIds.map(roundId => ({
    to: XALLOCATIONPOOL_CONTRACT,
    value: "0x0",
    data: contract.encodeFunctionData("roundEarnings", [roundId, app]),
  }))

  return clauses
}

export const getXAppTotalEarningsQueryKey = (tillRoundId: string | number, appId: string) => [
  "xApp",
  appId,
  "totalEarningsTillRound",
  tillRoundId,
]

/**
 * Total earnings of an xApp in multiple rounds
 * @param roundIds - IDs of the rounds
 * @param appId - ID of the xApp
 * @returns The total earnings of the xApp until the last round
 */
export const useXAppTotalEarnings = (roundIds: number[], appId: string) => {
  const thor = useThor()
  const lastRound = roundIds[roundIds.length - 1] ?? 0
  return useQuery({
    queryKey: getXAppTotalEarningsQueryKey(lastRound, appId),
    queryFn: async () => {
      const clauses = getXAppTotalEarningsClauses(roundIds, appId)
      const res = await thor.transactions.simulateTransaction(clauses)
      const contract = XAllocationPool__factory.createInterface()

      const decoded = res.map((r, index) => {
        if (r.reverted) throw new Error(`Clause ${index + 1} reverted`)

        const decoded = contract.decodeFunctionResult("roundEarnings", r.data)
        const parsedAmount = ethers.formatEther(decoded[0] as bigint)

        // Update the cache with the new amount
        queryClient.setQueryData(getXAppRoundEarningsQueryKey(roundIds[index] as number, appId), {
          amount: parsedAmount,
          appId,
        })
        return parsedAmount
      })

      return decoded.reduce((acc, amount) => {
        return acc + Number(amount)
      }, 0)
    },
  })
}
