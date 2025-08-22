import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "proposalVotes" as const

export const getProposalVotesQuerykey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
  })

/**
 * Hook to get the proposal votes from the governor contract (i.e the number of votes for, against and abstain)
 * @returns the proposal votes {@link ProposalVotes}
 */
export const useProposalVotes = (proposalId: string, enabled = true) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      enabled: !!proposalId && enabled,
      select: data => {
        const [againstVotes, forVotes, abstainVotes] = data
        const parsed = {
          againstVotes: ethers.formatEther(againstVotes),
          forVotes: ethers.formatEther(forVotes),
          abstainVotes: ethers.formatEther(abstainVotes),
        }

        const totalVotes = Number(parsed.againstVotes) + Number(parsed.forVotes) + Number(parsed.abstainVotes)
        return {
          ...parsed,
          totalVotes,
          againstPercentage: Math.min(100, (Number(parsed.againstVotes) / totalVotes) * 100),
          forPercentage: Math.min(100, (Number(parsed.forVotes) / totalVotes) * 100),
          abstainPercentage: Math.min(100, (Number(parsed.abstainVotes) / totalVotes) * 100),
        }
      },
    },
  })
}
