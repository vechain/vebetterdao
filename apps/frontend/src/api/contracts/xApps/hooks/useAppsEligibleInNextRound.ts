import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress
import { XAllocationVoting__factory as XAllocationVoting } from "@repo/contracts"

/**
 * Returns all apps that will be eligible in the next allocation round
 * @param thor  the thor client
 * @returns the ids of eligible apps
 */
export const getAppsEligibleInNextRound = async (thor: Connex.Thor): Promise<string[]> => {
  const functionFragment = XAllocationVoting.createInterface().getFunction("allElegibleApps").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getAppsEligibleInNextRoundQueryKey = () => ["AppsEligibleInNextRound"]

/**
 *  Hook to get all apps that will be eligible in the next allocation round
 * @returns the ids of eligible apps
 */
export const useAppsEligibleInNextRound = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAppsEligibleInNextRoundQueryKey(),
    queryFn: async () => await getAppsEligibleInNextRound(thor),
    enabled: !!thor,
  })
}
