import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { XAllocationPool__factory } from "@repo/contracts"

const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress

/**
 *  Check if user has already claimed allocation rewards for a specific round and xApp
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @param roundId  the round id
 * @returns if user has already claimed allocation rewards for a specific round and xApp
 */
export const getHasXAppClaimed = async (thor: Connex.Thor, xAppId: string, roundId: string): Promise<boolean> => {
  const functionFragment = XAllocationPool__factory.createInterface().getFunction("claimed").format("json")
  const res = await thor.account(XALLOCATIONPOOL_CONTRACT).method(JSON.parse(functionFragment)).call(roundId, xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getHasXAppClaimedQueryKey = (xAppId: string, roundId: string) => ["claimed", roundId, "appId", xAppId]

/**
 *  Check if user has already claimed allocation rewards for a specific round and xApp
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @param roundId  the round id
 * @returns if user has already claimed allocation rewards for a specific round and xApp
 */
export const useHasXAppClaimed = (xAppId: string, roundId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getHasXAppClaimedQueryKey(xAppId, roundId),
    queryFn: async () => await getHasXAppClaimed(thor, xAppId, roundId),
    enabled: !!thor,
  })
}
