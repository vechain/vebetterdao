import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { FormattingUtils } from "@repo/utils"
import { Emissions__factory } from "@repo/contracts"

const EMISSION_CONTRACT = getConfig().emissionsContractAddress

type AllocationAmount = {
  treasury: string
  voteX2Earn: string
  voteXAllocations: string
}

/**
 *
 * Returns the allocation amount for a given roundId
 * @param thor  the thor client
 * @param roundId  the roundId the get the amount for
 * @returns the allocation amount for a given roundId see {@link AllocationAmount}
 */
export const getAllocationAmount = async (
  thor: Connex.Thor,
  roundId?: string,
): Promise<{
  treasury: string
  voteX2Earn: string
  voteXAllocations: string
}> => {
  const emissionsInterface = Emissions__factory.createInterface()
  const functionFragmentTreasuryAmount = emissionsInterface.getFunction("getTreasuryAmount").format("json")
  const functionFragmentVoteX2EarnAmount = emissionsInterface.getFunction("getVote2EarnAmount").format("json")
  const functionFragmentXAllocationsAmount = emissionsInterface.getFunction("getXAllocationAmount").format("json")

  const [resTreasury, resVoteX2Earn, voteXAllocations] = await Promise.all([
    thor.account(EMISSION_CONTRACT).method(JSON.parse(functionFragmentTreasuryAmount)).call(roundId),
    thor.account(EMISSION_CONTRACT).method(JSON.parse(functionFragmentVoteX2EarnAmount)).call(roundId),
    thor.account(EMISSION_CONTRACT).method(JSON.parse(functionFragmentXAllocationsAmount)).call(roundId),
  ])

  if (resTreasury.vmError) return Promise.reject(new Error(resTreasury.vmError))
  if (resVoteX2Earn.vmError) return Promise.reject(new Error(resVoteX2Earn.vmError))
  if (voteXAllocations.vmError) return Promise.reject(new Error(voteXAllocations.vmError))

  return {
    treasury: FormattingUtils.scaleNumberDown(resTreasury.decoded[0], 18),
    voteX2Earn: FormattingUtils.scaleNumberDown(resVoteX2Earn.decoded[0], 18),
    voteXAllocations: FormattingUtils.scaleNumberDown(voteXAllocations.decoded[0], 18),
  }
}

export const getAllocationAmountQueryKey = (roundId?: string) => ["allocationsRound", "amount", roundId]

/**
 *  Hook to get the allocation amount for a given roundId
 * @param roundId  the roundId the get the amount for
 * @returns the allocation amount for a given roundId see {@link AllocationAmount}
 */
export const useAllocationAmount = (roundId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationAmountQueryKey(roundId),
    queryFn: async () => await getAllocationAmount(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
