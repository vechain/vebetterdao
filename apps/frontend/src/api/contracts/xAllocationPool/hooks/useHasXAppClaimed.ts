import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts"

const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress

type HasXAppClaimedQueryResponse = {
  claimed: boolean
  appId: string
}

/**
 *  Check if user has already claimed allocation rewards for a specific round and xApp
 *
 * @param thor  the connex instance
 * @param roundId  the round id
 * @param xAppId  the xApp id
 * @returns if user has already claimed allocation rewards for a specific round and xApp
 */
export const getHasXAppClaimed = async (
  thor: Connex.Thor,
  roundId: string,
  xAppId: string,
): Promise<HasXAppClaimedQueryResponse> => {
  const functionFragment = XAllocationPool__factory.createInterface().getFunction("claimed").format("json")
  const res = await thor.account(XALLOCATIONPOOL_CONTRACT).method(JSON.parse(functionFragment)).call(roundId, xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return { claimed: res.decoded[0], appId: xAppId }
}

export const getHasXAppClaimedQueryKey = (roundId: string, xAppId: string) => [
  "xAppClaimed",
  "roundId",
  roundId,
  "appId",
  xAppId,
]

/**
 *  Check if user has already claimed allocation rewards for a specific round and xApp
 *
 * @param thor  the connex instance
 * @param roundId  the round id
 * @param xAppId  the xApp id
 * @returns if user has already claimed allocation rewards for a specific round and xApp
 */
export const useHasXAppClaimed = (roundId: string, xAppId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getHasXAppClaimedQueryKey(roundId, xAppId),
    queryFn: async () => await getHasXAppClaimed(thor, roundId, xAppId),
    enabled: !!thor && !!roundId && !!xAppId,
  })
}
