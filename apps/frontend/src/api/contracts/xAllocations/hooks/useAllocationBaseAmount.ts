import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { XAllocationPool__factory, XAllocationVotingGovernorJson } from "@repo/contracts"
import { getAllocationsRoundState } from "./useAllocationsRoundState"
import { FormattingUtils } from "@repo/utils"

const XALLOCATIONPOOLCONTRACT = getConfig().xAllocationPoolContractAddress

/**
 * get the base xDapps allocation amount for a given roundId
 * @param thor  the thor client
 * @param roundId  the roundId the get state for
 * @returns  the base allocation for xDapps for a given roundId
 */
export const getAllocationBaseAmount = async (thor: Connex.Thor, roundId?: string): Promise<string> => {
  if (!roundId) return Promise.reject(new Error("roundId is required"))

  const functionFragment = XAllocationPool__factory.createInterface().getFunction("baseAllocationAmount").format("json")
  const res = await thor.account(XALLOCATIONPOOLCONTRACT).method(JSON.parse(functionFragment)).call(roundId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return FormattingUtils.scaleNumberDown(res.decoded[0], 18)
}

export const getAllocationBaseAmountQueryKey = (roundId?: string) => ["allocationRound", roundId, "baseAmount"]

/**
 *  Hook to get the base xDapps allocation amount for a given roundId
 * @param roundId  the roundId the get the base allocation for
 * @returns  the base allocation for xDapps for a given roundId
 */
export const useAllocationBaseAmount = (roundId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationBaseAmountQueryKey(roundId),
    queryFn: async () => await getAllocationBaseAmount(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
