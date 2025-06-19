import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"
import { formatEther } from "viem"

const address = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi
const method = "votingThreshold" as const

/**
 * Returns the query key for fetching the voting threshold from the governor contract.
 * @returns The query key for fetching the voting threshold.
 */
export const getVotingThresholdQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Get the voting threhsold (i.e the minimum number of votes required for casting a vote) in the governor contract
 * @returns the voting threshold
 */
export const useVotingThreshold = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => formatEther(BigInt(data[0])),
    },
  })
}
