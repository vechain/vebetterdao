import { getConfig } from "@repo/config"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationPool__factory"
import { DBAPool__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { ethers } from "ethers"

import { useDBADistributionStartRound } from "../../dbaPool/hooks/useDBADistributionStartRound"

import { getXAppRoundEarningsQueryKey } from "./useXAppRoundEarnings"

const abi = XAllocationPool__factory.abi
const address = getConfig().xAllocationPoolContractAddress as `0x${string}`
const dbaPoolAddress = getConfig().dbaPoolContractAddress as `0x${string}`
const dbaPoolAbi = DBAPool__factory.abi
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
 *  Total earnings of multiple xApps in multiple rounds including DBA rewards
 * @param appIds  the ids of the xApps
 * @param roundIds  the ids of the rounds
 * @param dbaStartRound  the round from which DBA distribution starts
 * @returns  the total earnings of the xApps in the rounds (roundEarnings + DBA rewards)
 */
export const useMultipleXAppsTotalEarnings = (roundIds: number[], appIds: string[]) => {
  const thor = useThor()
  const queryClient = useQueryClient()
  const { data: dbaStartRound } = useDBADistributionStartRound()

  return useQuery({
    queryKey: [...getXAppsTotalEarningsQueryKey(roundIds, appIds), "withDBA", dbaStartRound],
    queryFn: async () => {
      const results: Record<string, { amount: number; appId: string }> = {}
      appIds.forEach(appId => {
        results[appId] = { amount: 0, appId }
      })

      // Step 1: Get base roundEarnings for all apps and rounds
      const BATCH_SIZE = 5
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
                  }) as const,
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

      // Step 2: Add DBA rewards for eligible rounds (>= dbaStartRound)
      if (dbaStartRound !== undefined) {
        const eligibleRounds = roundIds.filter(r => r >= dbaStartRound)

        if (eligibleRounds.length > 0) {
          // Query DBA rewards for all apps using contract function
          const dbaRewardsCalls = appIds
            .map(appId =>
              eligibleRounds.map(
                roundId =>
                  ({
                    abi: dbaPoolAbi,
                    address: dbaPoolAddress,
                    functionName: "dbaRoundRewardsForApp",
                    args: [roundId, appId],
                  }) as const,
              ),
            )
            .flat()

          try {
            const dbaResults = await executeMultipleClausesCall({
              thor,
              calls: dbaRewardsCalls,
            })

            const callsPerApp = eligibleRounds.length

            dbaResults.forEach((result, index) => {
              const appIndex = Math.floor(index / callsPerApp)
              const appId = appIds[appIndex]

              if (appId && result) {
                const amount = (result as unknown as readonly [bigint])[0] ?? 0n
                const dbaAmount = Number(ethers.formatEther(amount))
                if (dbaAmount > 0) {
                  results[appId]!.amount += dbaAmount
                }
              }
            })
          } catch (error) {
            console.error("Error fetching DBA rewards:", error)
            // Continue without DBA data
          }
        }
      }

      return appIds.map(appId => results[appId] || { amount: 0, appId })
    },
    enabled: !!thor && !!appIds.length && !!roundIds.length,
  })
}
