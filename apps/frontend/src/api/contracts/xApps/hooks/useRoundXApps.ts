import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress
import { XAllocationVoting__factory as XAllocationVoting } from "@repo/contracts"
import { XApp } from "./useXApps"

/**
 * Returns all the available xApps (apps that can be voted on for allocation)
 * @param thor  the thor client
 * @param roundId  the id of the round the get state for
 * @returns  all the available xApps (apps that can be voted on for allocation) capped to 256 see {@link XApp}
 */
export const getRoundXApps = async (thor: Connex.Thor, roundId: string): Promise<XApp[]> => {
  const functionFragment = XAllocationVoting.createInterface().getFunction("getApps").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const apps = res.decoded[0]
  return apps.map((app: any) => ({
    id: app[0],
    receiverAddress: app[1],
    name: app[2],
    metadataURI: app[3],
    createdAt: app[4],
    createdAtTimestamp: app[5],
  }))
}

export const getRoundXAppsQueryKey = (roundId: string) => ["round", roundId, "xApps"]

/**
 *  Hook to get all the available xApps (apps that can be voted on for allocation)
 *
 *  @param roundId  the id of the round the get state for
 *
 *  @returns all the available xApps (apps that can be voted on for allocation) capped to 256
 */
export const useRoundXApps = (roundId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getRoundXAppsQueryKey(roundId),
    queryFn: async () => await getRoundXApps(thor, roundId),
    enabled: !!thor,
  })
}
