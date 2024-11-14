import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts/typechain-types"

const contractAddress = getConfig().xAllocationVotingContractAddress
const contractInterface = XAllocationVoting__factory.createInterface()
const method = "currentRoundDeadline"

/**
 * Returns the query key for fetching the current round deadline.
 * @returns The query key.
 */
export const getCurrentAllocationsRoundDeadlineQueryKey = () => {
  return getCallKey({ method, keyArgs: [] })
}

/**
 * Hook to get the blocknumber at which current round ends.
 * @returns The blocknumber.
 */
export const useCurrentAllocationsRoundDeadline = () => {
  return useCall({
    contractInterface,
    contractAddress,
    method,
    args: [],
  })
}
