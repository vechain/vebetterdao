import { useQueryClient, useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getXAppRoundEarningsQueryKey } from "./useXAppRoundEarnings"
import { getXAppTotalEarningsClauses } from "./useXAppTotalEarnings"
import { XAllocationPool__factory } from "@repo/contracts"
import { abi } from "thor-devkit"
import { ethers } from "ethers"

const roundEarningsFragment = XAllocationPool__factory.createInterface().getFunction("roundEarnings").format("json")
const roundEarningsAbi = new abi.Function(JSON.parse(roundEarningsFragment))

export const getXAppsTotalEarningsQueryKey = (roundIds: number[], appIds: string[]) => [
  "xApps",
  appIds,
  "totalEarnings",
  roundIds,
]

/**
 *  Total earnings of multiple xApps in multiple rounds
 * @param appIds  the ids of the xApps
 * @param roundIds  the ids of the rounds
 * @returns  the total earnings of the xApps in the rounds
 */
export const useMultipleXAppsTotalEarnings = (roundIds: number[], appIds: string[]) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getXAppsTotalEarningsQueryKey(roundIds, appIds),
    queryFn: async () => {
      const earningsPerAppClauses = appIds.map(appId => getXAppTotalEarningsClauses(roundIds, appId)).flat()

      const res = await thor.explain(earningsPerAppClauses).execute()

      const clausesPerApp = roundIds.length

      const results = res.reduce((acc: Record<string, { amount: number; appId: string }>, res, index) => {
        if (res.reverted) return acc

        const appIndex = Math.floor(index / clausesPerApp)
        const roundIndex = index % clausesPerApp

        // index is not out of bounds
        if (appIndex >= appIds.length || roundIndex >= roundIds.length) {
          return acc
        }

        const appId = appIds[appIndex]!
        const roundId = roundIds[roundIndex]!

        const decoded = roundEarningsAbi.decode(res.data)
        const parsedAmount = ethers.formatEther(decoded[0])
        const numAmount = Number(parsedAmount)

        // Update the cache
        queryClient.setQueryData(getXAppRoundEarningsQueryKey(roundId, appId), {
          amount: parsedAmount,
          appId,
        })

        // Add to the accumulator
        if (!acc[appId]) {
          acc[appId] = { amount: 0, appId }
        }

        acc[appId]!.amount += numAmount

        return acc
      }, {})

      return appIds.map(appId => results[appId] || { amount: 0, appId })
    },
    enabled: !!thor && !!appIds.length && !!roundIds.length,
  })
}
