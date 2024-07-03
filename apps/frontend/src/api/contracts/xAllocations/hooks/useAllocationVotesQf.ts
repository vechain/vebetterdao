import { getConfig } from "@repo/config"
import { XAllocationVotingGovernor__factory } from "@repo/contracts"
import { getCallKey, useCall } from "@/hooks"
import { ethers } from "ethers"

const ALLOCATION_VOTING_CONTRACT = getConfig().xAllocationVotingContractAddress
const allocationVotingInterface = XAllocationVotingGovernor__factory.createInterface()

/**
 *  Returns the query key for fetching the number of quadratic funding votes for a given roundId.
 * @param roundId  the roundId the get the votes for
 */
export const getAllocationVotesQfQueryKey = (roundId: number) =>
  getCallKey({ method: "totalVotesQF", keyArgs: [roundId] })

/**
 *  Hook to get the number of quadratic funding votes for a given roundId
 * @param roundId  the roundId the get the votes for
 * @returns  the number of votes for a given roundId
 */
export const useAllocationVotesQf = (roundId?: number | string) => {
  return useCall({
    contractInterface: allocationVotingInterface,
    contractAddress: ALLOCATION_VOTING_CONTRACT,
    method: "totalVotesQF",
    args: [roundId],
    enabled: !!roundId,
  })
}
