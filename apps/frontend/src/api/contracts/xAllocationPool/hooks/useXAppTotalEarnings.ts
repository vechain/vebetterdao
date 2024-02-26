import { useQueries } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getXAppRoundEarnings, getXAppRoundEarningsQueryKey } from "./useXAppRoundEarnings"

/**
 * Total earnings of an xApp in multiple rounds
 * 
 * @param roundIds ids of the rounds
 * @param appId id of the xApp

 * @returns (amount, appId)[] amount of $B3TR an xApp earned from an allocation round and the xApp id for each round
 */
export const useXAppTotalEarnings = (roundIds: string[], appId: string) => {
  const { thor } = useConnex()
  return useQueries({
    queries: roundIds.map(id => ({
      queryKey: getXAppRoundEarningsQueryKey(id, appId),
      queryFn: async () => {
        return getXAppRoundEarnings(thor, id, appId)
      },
    })),
  })
}
