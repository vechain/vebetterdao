import { useQuery } from "@tanstack/react-query"
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

export const getXAppTotalEarningsClauses = (roundIds: number[], app: string): Connex.VM.Clause[] => {
  const clauses: Connex.VM.Clause[] = roundIds.map(roundId => ({
    to: XALLOCATIONPOOL_CONTRACT,
    value: 0,
    data: roundEarningsAbi.encode(roundId, app),
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
 * @param roundIds ids of the rounds
 * @param appId id of the xApp
 * @returns the total earnings of the xApp until the last round
 */
export const useXAppTotalEarnings = (roundIds: number[], appId: string) => {
  const { thor } = useConnex()
  const lastRound = roundIds[roundIds.length - 1] ?? 0
  return useQuery({
    queryKey: getXAppTotalEarningsQueryKey(lastRound, appId),
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
