import { getConfig } from "@repo/config"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationPool__factory"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { ethers } from "ethers"

import { getXAppRoundEarningsQueryKey } from "./useXAppRoundEarnings"

const abi = XAllocationPool__factory.abi
const address = getConfig().xAllocationPoolContractAddress as `0x${string}`
export const getXAppsTotalEarningsQueryKey = (roundIds: number[], appIds: string[]) => [
  "xApps",
  appIds,
  "totalEarnings",
  roundIds,
]
// Helper function to chunk an array into smaller arrays
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}
/**
 *  Total earnings of multiple xApps in multiple rounds
 * @param appIds  the ids of the xApps
 * @param roundIds  the ids of the rounds
 * @returns  the total earnings of the xApps in the rounds
 */
export const useMultipleXAppsTotalEarnings = (roundIds: number[], appIds: string[]) => {
  const thor = useThor()
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: getXAppsTotalEarningsQueryKey(roundIds, appIds),
    queryFn: async () => {
      const results: Record<string, { amount: number; appId: string }> = {}
      appIds.forEach(appId => {
        results[appId] = { amount: 0, appId }
      })
      const BATCH_SIZE = 10
      const roundBatches = chunkArray(roundIds, BATCH_SIZE)
      for (const roundBatch of roundBatches) {
        const res = await executeMultipleClausesCall({
          thor,
          calls: appIds
            .map(appId =>
              roundBatch.map(
                roundId =>
                  ({
                    abi,
                    address,
                    functionName: "roundEarnings",
                    args: [roundId, appId],
                  } as const),
              ),
            )
            .flat(),
        })
        const clausesPerApp = roundBatch.length

        res.forEach((result, index) => {
          const appIndex = Math.floor(index / clausesPerApp)
          const roundIndex = index % clausesPerApp

          if (appIndex >= appIds.length || roundIndex >= roundBatch.length) {
            return
          }

          const appId = appIds[appIndex]!
          const roundId = roundBatch[roundIndex]!

          const parsedAmount = ethers.formatEther(result[0])
          const numAmount = Number(parsedAmount)

          // Update the cache
          queryClient.setQueryData(getXAppRoundEarningsQueryKey(roundId, appId), result)

          results[appId]!.amount += numAmount
        })
      }
      return appIds.map(appId => results[appId] || { amount: 0, appId })
    },
    enabled: !!thor && !!appIds.length && !!roundIds.length,
  })
}
