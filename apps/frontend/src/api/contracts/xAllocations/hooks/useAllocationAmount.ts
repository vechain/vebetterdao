import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { Emissions__factory } from "@repo/contracts/typechain-types"
import { ethers } from "ethers"

const EMISSION_CONTRACT = getConfig().emissionsContractAddress

type AllocationAmount = {
  treasury: string
  voteX2Earn: string
  voteXAllocations: string
  gm: string
}

/**
 * Returns the allocation amount for a given roundId
 * @param thor - The thor client
 * @param roundId - The roundId the get the amount for
 * @returns The allocation amount for a given roundId see {@link AllocationAmount}
 */
export const getAllocationAmount = async (thor: ThorClient, roundId?: string): Promise<AllocationAmount> => {
  const contract = thor.contracts.load(EMISSION_CONTRACT, Emissions__factory.abi)

  const [resTreasury, resVoteX2Earn, voteXAllocations, resGMRewards] = await Promise.all([
    contract.read.getTreasuryAmount(roundId),
    contract.read.getVote2EarnAmount(roundId),
    contract.read.getXAllocationAmount(roundId),
    contract.read.getGMAmount(roundId),
  ])

  if (!resTreasury) return Promise.reject(new Error("Treasury amount call failed"))
  if (!resVoteX2Earn) return Promise.reject(new Error("Vote2Earn amount call failed"))
  if (!voteXAllocations) return Promise.reject(new Error("XAllocation amount call failed"))
  if (!resGMRewards) return Promise.reject(new Error("GM rewards amount call failed"))

  return {
    treasury: ethers.formatEther(resTreasury[0] as bigint),
    voteX2Earn: ethers.formatEther(resVoteX2Earn[0] as bigint),
    voteXAllocations: ethers.formatEther(voteXAllocations[0] as bigint),
    gm: ethers.formatEther(resGMRewards[0] as bigint),
  }
}

export const getAllocationAmountQueryKey = (roundId?: string) => ["allocationsRound", "amount", roundId]

/**
 * Hook to get the allocation amount for a given roundId
 * @param roundId - The roundId the get the amount for
 * @returns The allocation amount for a given roundId see {@link AllocationAmount}
 */
export const useAllocationAmount = (roundId?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getAllocationAmountQueryKey(roundId),
    queryFn: async () => await getAllocationAmount(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
