import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { ethers } from "ethers"
import { getConfig } from "@repo/config"

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress
import { B3TRGovernorJson } from "@repo/contracts"
const b3trGovernorAbi = B3TRGovernorJson.abi

type ProposalVotes = {
  againstVotes: string
  forVotes: string
  abstainVotes: string
}
/**
 * Get the proposal votes from the governor contract (i.e the number of votes for, against and abstain)
 * @param thor  the thor client
 * @param proposalId  the proposal id to get the votes for
 * @returns  the proposal votes {@link ProposalVotes} with decimals scaled down
 */
export const getProposalVotes = async (thor: Connex.Thor, proposalId: string): Promise<ProposalVotes> => {
  const proposalVotesAbi = b3trGovernorAbi.find(abi => abi.name === "proposalVotes")
  if (!proposalVotesAbi) throw new Error("proposalVotes function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(proposalVotesAbi).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return {
    againstVotes: ethers.formatEther(res.decoded[0]),
    forVotes: ethers.formatEther(res.decoded[1]),
    abstainVotes: ethers.formatEther(res.decoded[2]),
  }
}

export const getProposalVotesQuerykey = (proposalId: string) => ["proposalVotes", proposalId]
/**
 * Hook to get the proposal votes from the governor contract (i.e the number of votes for, against and abstain)
 * @returns the proposal votes {@link ProposalVotes}
 */
export const useProposalVotes = (proposalId: string, enabled = true) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalVotesQuerykey(proposalId),
    queryFn: async () => await getProposalVotes(thor, proposalId),
    enabled: !!thor && enabled,
  })
}
