import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress
import { XAllocationVoting__factory as XAllocationVoting } from "@repo/contracts"
/**
 * xApp type
 * @property id  the xApp id
 * @property receiverAddress  the xApp address
 * @property name  the xApp name
 * @property createdAt block when xApp was addded
 */
export type XApp = {
  id: string
  receiverAddress: string
  name: string
  createdAt: number
}

/**
 * Returns all the available xApps in the B3TR ecosystem
 * @param thor  the thor client
 * @returns  all the available xApps in the ecosystem capped to 256 see {@link XApp}
 */
export const getXApps = async (thor: Connex.Thor): Promise<XApp[]> => {
  const functionFragment = XAllocationVoting.createInterface().getFunction("getAllApps").format("json")
  const res = await thor.account(XALLOCATIONVOTING_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const apps = res.decoded[0]
  return apps.map((app: any) => ({
    id: app[0],
    receiverAddress: app[1],
    name: app[2],
    metadata: app[3],
    createdAt: app[4],
  }))
}

export const getXAppsQueryKey = () => ["xApps"]

/**
 *  Hook to get all the available xApps in the B3TR ecosystem
 * @returns all the available xApps in the B3TR ecosystem capped to 256
 */
export const useXApps = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getXAppsQueryKey(),
    queryFn: async () => await getXApps(thor),
    enabled: !!thor,
  })
}
