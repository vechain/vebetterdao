import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { XAllocationPool__factory } from "@repo/contracts"

const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress

/**
 *  Get the amount of $B3TR an xApp can claim from an allocation round
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @param roundId  the round id
 * @returns  amount of $B3TR an xApp can claim from an allocation round
 */
export const getXAppClaimableAmount = async (thor: Connex.Thor, xAppId: string, roundId: string): Promise<string> => {
  const functionFragment = XAllocationPool__factory.createInterface().getFunction("claimableAmount").format("json")
  const res = await thor.account(XALLOCATIONPOOL_CONTRACT).method(JSON.parse(functionFragment)).call(roundId, xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

export const getXAppClaimableAmountQueryKey = (xAppId?: string, roundId?: string) => [
  "claimableAmount",
  roundId,
  "appId",
  xAppId,
]

/**
 * Get the amount of $B3TR an xApp can claim from an allocation round
 *
 * @param xAppId the xApp id
 * @param roundId the round id
 * @returns amount of $B3TR an xApp can claim from an allocation round
 */
export const useXAppClaimableAmount = (xAppId: string, roundId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getXAppClaimableAmountQueryKey(xAppId, roundId),
    queryFn: async () => await getXAppClaimableAmount(thor, xAppId, roundId),
    enabled: !!thor,
  })
}
