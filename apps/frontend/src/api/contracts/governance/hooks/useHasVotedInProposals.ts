import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"

import { getConfig } from "@repo/config"
import { B3TRGovernorJson } from "@repo/contracts"
const b3trGovernorAbi = B3TRGovernorJson.abi
const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

/**
 * Check if the given address has voted on the given proposal
 * @param thor  the thor client
 * @param proposalId the proposal id
 * @param address the address to check
 * @returns if the given address has voted on the given proposal
 */
export const getHasVoted = async (thor: Connex.Thor, proposalId: string, address?: string): Promise<boolean> => {
  if (!address) throw new Error("address is required")

  const getHasVotedAbi = b3trGovernorAbi.find(abi => abi.name === "hasVoted")
  if (!getHasVotedAbi) throw new Error("hasVoted function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(getHasVotedAbi).call(proposalId, address)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

export const getHasVotedQueryKey = (proposalIds: string[], address?: string) => ["hasVoted", proposalIds, address]
/**
 * Hook to check if the given address has voted on the given proposals
 * @param proposalIds Array of proposal IDs to check
 * @param address Address to check voting status for
 * @returns Array of objects containing proposalId and hasVoted status for each proposal
 */
export const useHasVotedInProposals = (
  proposalIds: string[],
  address?: string,
): UseQueryResult<Record<string, boolean>> => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getHasVotedQueryKey(proposalIds, address),
    queryFn: async () => Promise.all(proposalIds.map(proposalId => getHasVoted(thor, proposalId, address))),
    select: hasVoted =>
      proposalIds.reduce(
        (acc, proposalId, index) => ({
          ...acc,
          [proposalId]: hasVoted[index],
        }),
        {},
      ),
    enabled: !!thor && !!address && !!proposalIds.length,
  })
}
