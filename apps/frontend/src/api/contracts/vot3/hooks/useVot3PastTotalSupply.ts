import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { VOT3__factory } from "@repo/contracts"

const config = getConfig()
const VOT3_CONTRACT = config.vot3ContractAddress

/**
 *  Get the total supply of VOT3 at a given timepoint (in the past)
 * @param thor  The thor instance
 * @param timepoint  The timepoint to get the total supply at (block)
 * @returns the total supply of VOT3 at the given timepoint
 */
export const getVot3PastTotalSupply = async (thor: Connex.Thor, timepoint?: number | string): Promise<string> => {
  if (!timepoint) return Promise.reject(new Error("Timepoint is required"))
  const functionFragment = VOT3__factory.createInterface().getFunction("getPastTotalSupply").format("json")
  const res = await thor.account(VOT3_CONTRACT).method(JSON.parse(functionFragment)).call(timepoint)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

export const getVot3PastTotalSupplyQueryKey = (timepoint?: number | string) => ["vot3", "supplyAt", timepoint]

/**
 *  Hook to get the total supply of VOT3 at a given timepoint (in the past)
 * @param timepoint  The timepoint to get the total supply at (block)
 * @returns  the total supply of VOT3 at the given timepoint
 */
export const useVot3PastSupply = (timepoint?: number | string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getVot3PastTotalSupplyQueryKey(timepoint),
    queryFn: () => getVot3PastTotalSupply(thor, timepoint),
    enabled: !!timepoint,
  })
}
