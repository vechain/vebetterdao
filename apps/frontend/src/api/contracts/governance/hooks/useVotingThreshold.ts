import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { formatEther } from "viem"

import { ProposalType } from "../../../../types/proposals"

const address = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi
const method = "votingThresholdByProposalType" as const
/**
 * Returns the query key for fetching the voting threshold from the governor contract.
 * @param proposalType - The type of proposal to get the threshold for. If not provided, the standard proposal threshold is returned.
 * @returns The query key for fetching the voting threshold.
 */
export const getVotingThresholdQueryKey = (proposalType: ProposalType) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [proposalType] })
/**
 * Get the voting threhsold (i.e the minimum number of votes required for casting a vote) in the governor contract
 * @param proposalType - The type of proposal to get the threshold for. If not provided, the standard proposal threshold is returned.
 * @returns the voting threshold
 */
export const useVotingThreshold = (proposalType?: ProposalType) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [proposalType ?? ProposalType.STANDARD],
    queryOptions: {
      select: data => formatEther(BigInt(data[0])),
    },
  })
}
