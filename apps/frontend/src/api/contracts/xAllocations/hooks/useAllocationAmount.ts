import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { Emissions__factory as Emissions } from "@repo/contracts/typechain-types"
import { FormattingUtils } from "@repo/utils"

const EMISSION_CONTRACT = getConfig().emissionsContractAddress

type AllocationAmount = {
  treasury: string
  voteX2Earn: string
  voteXAllocations: string
}

/**
 *
 * Returns the allocation amount for a given proposalId
 * @param thor  the thor client
 * @param proposalId  the proposalId the get the amount for
 * @returns the allocation amount for a given proposalId see {@link AllocationAmount}
 */
export const getAllocationAmount = async (
  thor: Connex.Thor,
  proposalId?: string,
): Promise<{
  treasury: string
  voteX2Earn: string
  voteXAllocations: string
}> => {
  const functionFragmentTreasuryAmount = Emissions.createInterface()
    .getFunction("getTreasuryAmountForCycle")
    .format("json")
  const functionFragmentVoteX2EarnAmount = Emissions.createInterface()
    .getFunction("getVote2EarnAmountForCycle")
    .format("json")
  const functionFragmentXAllocationsAmount = Emissions.createInterface()
    .getFunction("getXAllocationAmountForCycle")
    .format("json")

  const [resTreasury, resVoteX2Earn, voteXAllocations] = await Promise.all([
    thor.account(EMISSION_CONTRACT).method(JSON.parse(functionFragmentTreasuryAmount)).call(proposalId),
    thor.account(EMISSION_CONTRACT).method(JSON.parse(functionFragmentVoteX2EarnAmount)).call(proposalId),
    thor.account(EMISSION_CONTRACT).method(JSON.parse(functionFragmentXAllocationsAmount)).call(proposalId),
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

export const getAllocationAmountQueryKey = (proposalId?: string) => ["allocationsRound", "amount", proposalId]

/**
 *  Hook to get the allocation amount for a given proposalId
 * @param proposalId  the proposalId the get the amount for
 * @returns the allocation amount for a given proposalId see {@link AllocationAmount}
 */
export const useAllocationAmount = (proposalId?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getAllocationAmountQueryKey(proposalId),
    queryFn: async () => await getAllocationAmount(thor, proposalId),
    enabled: !!thor && !!proposalId,
  })
}
