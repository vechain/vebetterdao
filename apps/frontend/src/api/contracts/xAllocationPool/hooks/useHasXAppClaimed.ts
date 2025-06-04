import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts/typechain-types"

const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress

type HasXAppClaimedQueryResponse = {
  claimed: boolean
  appId: string
}

/**
 * Check if user has already claimed allocation rewards for a specific round and xApp
 *
 * @param thor - The thor client
 * @param roundId - The round id
 * @param xAppId - The xApp id
 * @returns If user has already claimed allocation rewards for a specific round and xApp
 */
export const getHasXAppClaimed = async (
  thor: ThorClient,
  roundId: string,
  xAppId: string,
): Promise<HasXAppClaimedQueryResponse> => {
  const res = await thor.contracts
    .load(XALLOCATIONPOOL_CONTRACT, XAllocationPool__factory.abi)
    .read.claimed(roundId, xAppId)

  if (!res) return Promise.reject(new Error("Claimed call failed"))

  return { claimed: res[0] as boolean, appId: xAppId }
}

export const getHasXAppClaimedQueryKey = (roundId: string, xAppId: string) => [
  "xAppClaimed",
  "roundId",
  roundId,
  "appId",
  xAppId,
]

/**
 * Check if user has already claimed allocation rewards for a specific round and xApp
 *
 * @param roundId - The round id
 * @param xAppId - The xApp id
 * @returns If user has already claimed allocation rewards for a specific round and xApp
 */
export const useHasXAppClaimed = (roundId: string, xAppId: string) => {
  const thor = useThor()
  return useQuery({
    queryKey: getHasXAppClaimedQueryKey(roundId, xAppId),
    queryFn: async () => await getHasXAppClaimed(thor, roundId, xAppId),
    enabled: !!thor && !!roundId && !!xAppId,
  })
}
