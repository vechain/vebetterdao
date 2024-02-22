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
export const getXAppClaimableAmount = async (thor: Connex.Thor, roundId: string, xAppId: string): Promise<string> => {
  const functionFragment = XAllocationPool__factory.createInterface().getFunction("claimableAmount").format("json")
  const res = await thor.account(XALLOCATIONPOOL_CONTRACT).method(JSON.parse(functionFragment)).call(roundId, xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

export const getXAppClaimableAmountQueryKey = (roundId: string, xAppId: string) => [
  "claimableAmount",
  roundId,
  "appId",
  xAppId,
]

/**
 * Get the amount of $B3TR an xApp can claim from an allocation round
 *
 * @param roundId the round id
 * @param xAppId the xApp id
 * @returns amount of $B3TR an xApp can claim from an allocation round
 */
export const useXAppClaimableAmount = (roundId: string, xAppId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getXAppClaimableAmountQueryKey(roundId, xAppId),
    queryFn: async () => await getXAppClaimableAmount(thor, roundId, xAppId),
    enabled: !!thor,
  })
}
