import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getXAppRoundEarningsQueryKey } from "./useXAppRoundEarnings"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts"
import { abi } from "thor-devkit"
import { ethers } from "ethers"
import { queryClient } from "@/api/QueryProvider"

const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress
const roundEarningsFragment = XAllocationPool__factory.createInterface().getFunction("roundEarnings").format("json")
const roundEarningsAbi = new abi.Function(JSON.parse(roundEarningsFragment))

const getXAppTotalEarningsClauses = (roundIds: number[], app: string): Connex.VM.Clause[] => {
  const clauses: Connex.VM.Clause[] = roundIds.map(roundId => ({
    to: XALLOCATIONPOOL_CONTRACT,
    value: 0,
    data: roundEarningsAbi.encode(roundId, app),
  }))

  return clauses
}

export const getXAppTotalEarningsQueryKey = (appId: string, tillRoundId: string | number) => [
  "xApp",
  appId,
  "totalEarningsTillRound",
  tillRoundId,
]
/**
 * Total earnings of an xApp in multiple rounds
 * @param roundIds ids of the rounds
 * @param appId id of the xApp
 * @returns the total earnings of the xApp until the last round
 */
export const useXAppTotalEarnings = (roundIds: number[], appId: string) => {
  const { thor } = useConnex()
  const lastRound = roundIds[roundIds.length - 1] ?? 0
  return useQuery({
    queryKey: getXAppTotalEarningsQueryKey(appId, lastRound),
    queryFn: async () => {
      const clauses = getXAppTotalEarningsClauses(roundIds, appId)
      const res = await thor.explain(clauses).execute()

      const decoded = res.map((r, index) => {
        const decoded = roundEarningsAbi.decode(r.data)
        const parsedAmount = ethers.formatEther(decoded[0])
        // Update the cache with the new amount
        queryClient.setQueryData(getXAppRoundEarningsQueryKey(roundIds[index] as number, appId), parsedAmount)
        return parsedAmount
      })

      return decoded.reduce((acc, amount) => {
        return acc + Number(amount)
      }, 0)
    },
  })
}

export const getXAppsTotalEarningsQueryKey = (appIds: string[], roundIds: number[]) => [
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
export const useXAppsTotalEarnings = (appIds: string[], roundIds: number[]) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: getXAppsTotalEarningsQueryKey(appIds, roundIds),
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
