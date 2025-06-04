import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress
import { XAllocationVoting__factory as XAllocationVoting } from "@repo/contracts"
import { XApp } from "../getXApps"
import { ThorClient } from "@vechain/sdk-network"

/**
 * Returns all the available xApps (apps that can be voted on for allocation)
 * @param thor  the thor client
 * @param roundId  the id of the round the get state for
 * @returns  all the available xApps (apps that can be voted on for allocation) capped to 256 see {@link XApp}
 */
export const getRoundXApps = async (thor: ThorClient, roundId?: string): Promise<XApp[]> => {
  if (!roundId) return []
  const res = await thor.contracts.load(XALLOCATIONVOTING_CONTRACT, XAllocationVoting.abi).read.getAppsOfRound(roundId)

  if (!res) return Promise.reject(new Error("Failed to fetch xApps"))

  const apps = res[0] as any[]
  return apps.map((app: any) => ({
    id: app[0],
    teamWalletAddress: app[1],
    name: app[2],
    metadataURI: app[3],
    createdAtTimestamp: app[4],
  })) as XApp[]
}

export const getRoundXAppsQueryKey = (roundId?: string) => ["round", roundId, "getXApps"]

/**
 *  Hook to get all the available xApps (apps that can be voted on for allocation)
 *
 *  @param roundId  the id of the round the get state for
 *
 *  @returns all the available xApps (apps that can be voted on for allocation) capped to 256
 */
export const useRoundXApps = (roundId?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getRoundXAppsQueryKey(roundId),
    queryFn: async () => await getRoundXApps(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
