import { useQuery } from "@tanstack/react-query"
import { executeMultipleClausesCall, ThorClient, useThor } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain-kit/vebetterdao-contracts"
import { ethers } from "ethers"

const abi = Emissions__factory.abi
const address = getConfig().emissionsContractAddress as `0x${string}`
const methods = ["getTreasuryAmount", "getVote2EarnAmount", "getXAllocationAmount", "getGMAmount"] as const

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
    calls: methods.map(
      method =>
        ({
          abi,
          address,
          functionName: method,
          args: [BigInt(roundId)],
        }) as const,
    ),
  })

  return {
    treasury: ethers.formatEther(BigInt(resTreasury ?? 0)),
    voteX2Earn: ethers.formatEther(BigInt(resVoteX2Earn ?? 0)),
    voteXAllocations: ethers.formatEther(BigInt(voteXAllocations ?? 0)),
    gm: ethers.formatEther(BigInt(resGMRewards ?? 0)),
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
