import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import GovernorContract from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
import { getConfig } from "@repo/config"
const GOVERNANCE_CONTRACT = getConfig().governorContractAddress
const governorContractAbi = GovernorContract.abi

type ProposalVotes = {
  againstVotes: string
  forVotes: string
  abstainVotes: string
}
/**
 * Get the proposal votes from the governor contract (i.e the number of votes for, against and abstain)
 * @param thor  the thor client
 * @param proposalId  the proposal id to get the votes for
 * @returns  the current proposal threshold
 */
export const getProposalVotes = async (thor: Connex.Thor, proposalId: string): Promise<ProposalVotes> => {
  const proposalVotesAbi = governorContractAbi.find(abi => abi.name === "proposalVotes")
  if (!proposalVotesAbi) throw new Error("proposalVotes function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(proposalVotesAbi).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return {
    againstVotes: res.decoded[0],
    forVotes: res.decoded[1],
    abstainVotes: res.decoded[2],
  }
}

export const getProposalVotesQuerykey = (proposalId: string) => ["proposalVotes", proposalId]
/**
 * Hook to get the proposal votes from the governor contract (i.e the number of votes for, against and abstain)
 * @returns the proposal votes {@link ProposalVotes}
 */
export const useProposalVotes = (proposalId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalVotesQuerykey(proposalId),
    queryFn: async () => await getProposalVotes(thor, proposalId),
    enabled: !!thor,
  })
}
