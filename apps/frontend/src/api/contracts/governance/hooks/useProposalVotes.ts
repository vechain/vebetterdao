import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { ethers } from "ethers"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"
import { EnvConfig } from "@repo/config/contracts"

type ProposalVotes = {
  againstVotes: string
  forVotes: string
  abstainVotes: string
  totalVotes: number
  againstPercentage: number
  forPercentage: number
  abstainPercentage: number
}

/**
 * Get the proposal votes from the governor contract (i.e the number of votes for, against and abstain)
 * @param thor - The thor client
 * @param env - The environment config
 * @param proposalId - The proposal id to get the votes for
 * @returns The proposal votes {@link ProposalVotes} with decimals scaled down
 */
export const getProposalVotes = async (
  thor: ThorClient,
  env: EnvConfig,
  proposalId: string,
): Promise<ProposalVotes> => {
  const governanceContractAddress = getConfig(env).b3trGovernorAddress

  const res = await thor.contracts
    .load(governanceContractAddress, B3TRGovernor__factory.abi)
    .read.proposalVotes(proposalId)

  if (!res) return Promise.reject(new Error("Proposal votes call failed"))

  const [againstVotes, forVotes, abstainVotes] = res as [bigint, bigint, bigint]

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
}

export const getProposalVotesQuerykey = (proposalId: string) => ["proposalVotes", proposalId]

/**
 * Hook to get the proposal votes from the governor contract (i.e the number of votes for, against and abstain)
 * @param env - The environment config
 * @param proposalId - The proposal ID
 * @param enabled - Whether the query is enabled
 * @returns The proposal votes {@link ProposalVotes}
 */
export const useProposalVotes = (env: EnvConfig, proposalId: string, enabled = true) => {
  const thor = useThor()

  return useQuery({
    queryKey: getProposalVotesQuerykey(proposalId),
    queryFn: async () => await getProposalVotes(thor, env, proposalId),
    enabled: !!thor && enabled,
  })
}
