import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress
import { XAllocationVoting__factory as XAllocationVoting } from "@repo/contracts"

/**
 * xApp type
 * @property id  the xApp id
 * @property addr  the xApp address
 * @property name  the xApp name
 * @property metadata  the xApp metadata (ipfs hash)
 * @property createdAt block when xApp was addded
 */
type XApp = {
  id: string
  addr: string
  name: string
  metadata: string //ipfs hash
  createdAt: number
}

/**
 * Returns all the available xApps (apps that can be voted on for allocation)
 * @param thor  the thor client
 * @param roundId  the id of the round the get state for
 * @returns  all the available xApps (apps that can be voted on for allocation) capped to 256 see {@link XApp}
 */
export const getRoundXApps = async (thor: Connex.Thor, roundId: string): Promise<XApp[]> => {
  const functionFragment = XAllocationVoting.createInterface().getFunction("getRoundAppsWithDetails").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const apps = res.decoded[0]
  return apps.map((app: any) => ({
    id: app[0],
    addr: app[1],
    name: app[2],
    metadata: app[3],
    createdAt: app[4],
  }))
}

export const getRoundXAppsQueryKey = (proposalId: string) => ["round", proposalId, "xApps"]

/**
 *  Hook to get all the available xApps (apps that can be voted on for allocation)
 *
 *  @param roundId  the id of the round the get state for
 *
 *  @returns all the available xApps (apps that can be voted on for allocation) capped to 256
 */
export const useRoundXApps = (proposalId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getRoundXAppsQueryKey(proposalId),
    queryFn: async () => await getRoundXApps(thor, proposalId),
    enabled: !!thor,
  })
}
