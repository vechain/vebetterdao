import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/governance/B3TRGovernor__factory"
import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { formatEther } from "viem"

import { ProposalType } from "../../../../types/proposals"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "depositThresholdByProposalType" as const
/**
 * Returns the query key for fetching the deposit threshold from the governor contract.
 * @param proposalType - The type of proposal to get the threshold for. If not provided, the standard proposal threshold is returned.
 * @returns The query key for fetching the deposit threshold.
 */
export const getDepositThresholdQueryKey = (proposalType: ProposalType) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [proposalType] })
/**
 * Hook to get the proposal threshold from the governor contract (i.e the number of votes required to create a proposal)
 * @param proposalType - The type of proposal to get the threshold for. If not provided, the standard proposal threshold is returned.
 * @returns the current proposal threshold
 */
export const useDepositThreshold = (proposalType?: ProposalType) => {
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
