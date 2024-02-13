import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress
import { XAllocationPool__factory as XAllocationPool } from "@repo/contracts/typechain-types"
/**
 * xApp type
 * @property id  the xApp id
 * @property addr  the xApp address
 * @property name  the xApp name
 * @property metadata  the xApp metadata (ipfs hash)
 * @property appAvailableForAllocationVoting  whether the xApp is available for allocation voting
 */
export type XApp = {
  id: string
  addr: string
  name: string
  metadata: string //ipfs hash
  appAvailableForAllocationVoting: boolean
}

/**
 *  Returns all the available xApps (apps that can be voted on for allocation)
 * @param thor  the thor client
 * @returns  all the available xApps (apps that can be voted on for allocation) capped to 256 see {@link XApp}
 */
export const getXApps = async (thor: Connex.Thor): Promise<XApp[]> => {
  const functionFragment = XAllocationPool.createInterface().getFunction("getAllApps").format("json")
  const res = await thor.account(XALLOCATIONPOOL_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getXAppsQueryKey = () => ["xApps"]

/**
 *  Hook to get all the available xApps (apps that can be voted on for allocation)
 * @returns all the available xApps (apps that can be voted on for allocation) capped to 256
 */
export const useXApps = () => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getXAppsQueryKey(),
    queryFn: async () => await getXApps(thor),
    enabled: !!thor,
  })
}
