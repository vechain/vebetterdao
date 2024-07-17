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

      const decoded = res.map((r, index) => {
        const decoded = roundEarningsAbi.decode(r.data)
        const parsedAmount = ethers.formatEther(decoded[0])
        // Update the cache with the new amount
        queryClient.setQueryData(getXAppRoundEarningsQueryKey(roundIds[index] as number, appIds[index]), parsedAmount)
        return parsedAmount
      })

      // aggregate the earnings of each app, keeping in mind that the earnings are in the same order as the clauses and we have roundsIds.length clauses per app

      const totalEarningsPerApp = appIds.map((appId, index) => {
        const total = decoded.slice(index * roundIds.length, (index + 1) * roundIds.length).reduce((acc, amount) => {
          return acc + Number(amount)
        }, 0)
        return { amount: total, appId }
      })
      return totalEarningsPerApp
    },
    enabled: !!thor && !!appIds.length && !!roundIds.length,
  })
}
