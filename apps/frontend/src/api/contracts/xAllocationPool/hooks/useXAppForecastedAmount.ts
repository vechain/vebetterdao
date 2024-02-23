import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { XAllocationPool__factory } from "@repo/contracts"

const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress

/**
 *  Get the amount of $B3TR an xApp can claim for an ongoing allocation round
 *
 * @param thor  the connex instance
 * @param xAppId  the xApp id
 * @returns  amount of $B3TR an xApp can claim for an ongoing allocation round
 */
export const getXAppForecastedAmount = async (thor: Connex.Thor, xAppId: string): Promise<string> => {
  const functionFragment = XAllocationPool__factory.createInterface()
    .getFunction("forecastClaimableAmountForActiveRound")
    .format("json")
  const res = await thor.account(XALLOCATIONPOOL_CONTRACT).method(JSON.parse(functionFragment)).call(xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

export const getXAppForecastAmountQueryKey = (xAppId?: string) => ["forecastAmountForActiveRound", xAppId]

/**
 * Get the amount of $B3TR an xApp can claim for an ongoing allocation round
 *
 * @param xAppId the xApp id
 * @returns amount of $B3TR an xApp can claim for an ongoing allocation round
 */
export const useXAppForecastedAmount = (xAppId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getXAppForecastAmountQueryKey(xAppId),
    queryFn: async () => await getXAppForecastedAmount(thor, xAppId),
    enabled: !!thor && !!xAppId,
  })
}
