import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { XAllocationPool__factory } from "@repo/contracts"

const XALLOCATIONPOOL_CONTRACT = getConfig().xAllocationPoolContractAddress

type UseXAppRoundEarningsQueryResponse = {
  amount: string
  appId: string
}

/**
 *  Get the amount of $B3TR an xApp earned from an allocation round
 *
 * @param thor  the connex instance
 * @param roundId  the round id
 * @param xAppId  the xApp id
 * @returns (amount, appId) amount of $B3TR an xApp earned from an allocation round and the xApp id
 */
export const getXAppRoundEarnings = async (
  thor: Connex.Thor,
  roundId: string,
  xAppId: string,
): Promise<UseXAppRoundEarningsQueryResponse> => {
  const functionFragment = XAllocationPool__factory.createInterface().getFunction("roundEarnings").format("json")
  const res = await thor.account(XALLOCATIONPOOL_CONTRACT).method(JSON.parse(functionFragment)).call(roundId, xAppId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return { amount: FormattingUtils.scaleNumberDown(res.decoded[0], 18), appId: xAppId }
}

export const getXAppRoundEarningsQueryKey = (roundId: string, xAppId?: string) => [
  "roundEarnings",
  "roundId",
  roundId,
  "appId",
  ...(xAppId ? [xAppId] : []),
]

/**
 * Get the amount of $B3TR an xApp can claim from an allocation round
 *
 * @param roundId the round id
 * @param xAppId the xApp id
 * @returns amount of $B3TR an xApp can claim from an allocation round
 */
export const useXAppRoundEarnings = (roundId: string, xAppId: string) => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: getXAppRoundEarningsQueryKey(roundId, xAppId),
    queryFn: async () => await getXAppRoundEarnings(thor, roundId, xAppId),
    enabled: !!thor && !!roundId && !!xAppId,
  })
}
