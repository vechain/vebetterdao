import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { XAllocationPool__factory } from "@repo/contracts"
import { FormattingUtils } from "@repo/utils"

const XALLOCATIONPOOLCONTRACT = getConfig().xAllocationPoolContractAddress

/**
 * get the max xDapps allocation amount for a given roundId
 * @param thor  the thor client
 * @param roundId  the roundId the get state for
 * @returns  the max allocation for xDapps for a given roundId
 */
export const getMaxAllocationAmount = async (thor: Connex.Thor, roundId?: string): Promise<string> => {
  if (!roundId) return Promise.reject(new Error("roundId is required"))

  const functionFragment = XAllocationPool__factory.createInterface().getFunction("getMaxAppAllocation").format("json")
  const res = await thor.account(XALLOCATIONPOOLCONTRACT).method(JSON.parse(functionFragment)).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

export const getMaxAllocationAmountQueryKey = (roundId?: string) => ["allocationRound", roundId, "maxAllocationAmount"]

/**
 *  Hook to get the max xDapps allocation amount for a given roundId
 * @param roundId  the roundId the get the base allocation for
 * @returns  the max allocation for xDapps for a given roundId
 */
export const useMaxAllocationAmount = (roundId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getMaxAllocationAmountQueryKey(roundId),
    queryFn: async () => await getMaxAllocationAmount(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
