import { useQuery } from "@tanstack/react-query"
import { executeMultipleClausesCall, ThorClient, useThor } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { Emissions__factory } from "@repo/contracts"
import { ethers } from "ethers"

const abi = Emissions__factory.abi
const address = getConfig().emissionsContractAddress as `0x${string}`

type AllocationAmount = {
  treasury: string
  voteX2Earn: string
  voteXAllocations: string
  gm: string
}

/**
 *
 * Returns the allocation amount for a given roundId
 * @param thor  the thor client
 * @param roundId  the roundId the get the amount for
 * @returns the allocation amount for a given roundId see {@link AllocationAmount}
 */
export const getAllocationAmount = async (thor: ThorClient, roundId?: string): Promise<AllocationAmount> => {
  if (!roundId) return Promise.reject(new Error("roundId is required"))

  const [resTreasury, resVoteX2Earn, voteXAllocations, resGMRewards] = await executeMultipleClausesCall({
    thor,
    calls: [
      {
        address,
        abi,
        functionName: "getTreasuryAmount",
        args: [BigInt(roundId)],
      },
      {
        address,
        abi,
        functionName: "getVote2EarnAmount",
        args: [BigInt(roundId)],
      },
      {
        address,
        abi,
        functionName: "getXAllocationAmount",
        args: [BigInt(roundId)],
      },
      {
        address,
        abi,
        functionName: "getGMAmount",
        args: [BigInt(roundId)],
      },
    ],
  })

  return {
    treasury: ethers.formatEther(resTreasury),
    voteX2Earn: ethers.formatEther(resVoteX2Earn),
    voteXAllocations: ethers.formatEther(voteXAllocations),
    gm: ethers.formatEther(resGMRewards),
  }
}

export const getAllocationAmountQueryKey = (roundId?: string) => ["allocationsRound", "amount", roundId]

/**
 *  Hook to get the allocation amount for a given roundId
 * @param roundId  the roundId the get the amount for
 * @returns the allocation amount for a given roundId see {@link AllocationAmount}
 */
export const useAllocationAmount = (roundId?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getAllocationAmountQueryKey(roundId),
    queryFn: async () => await getAllocationAmount(thor, roundId),
    enabled: !!thor && !!roundId,
  })
}
