import { getConfig } from "@repo/config"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import {
  executeMultipleClausesCall,
  ThorClient,
  useCurrentAllocationsRoundId,
  useThor,
  useWallet,
} from "@vechain/vechain-kit"

import { fetchContractEvents } from "../fetchContractEvents"

const abi = B3TRGovernor__factory.abi
const contractAddress = getConfig().b3trGovernorAddress as `0x${string}`
const functionName = "hasVoted" as const
/**
 * Check if the given address has voted on the given proposal
 * @param thor  the thor client
 * @param proposalId the proposal id
 * @param address the address to check
 * @returns if the given address has voted on the given proposal
 */
export const getHasVoted = async (thor: ThorClient, proposalIds: string[], address?: string) => {
  if (!address) throw new Error("address is required")
  const hasVoted = await executeMultipleClausesCall({
    thor,
    calls: proposalIds.map(
      id =>
        ({
          abi,
          address: contractAddress,
          functionName,
          args: [id, address as `0x${string}`],
        }) as const,
    ),
  })
  return proposalIds.reduce(
    (acc, proposalId, index) => {
      acc[proposalId] = hasVoted[index] || false
      return acc
    },
    {} as Record<string, boolean>,
  )
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
  userAddress?: string,
): UseQueryResult<Record<string, boolean>> => {
  const thor = useThor()

  return useQuery({
    queryKey: getHasVotedQueryKey(proposalIds, userAddress),
    queryFn: async () => getHasVoted(thor, proposalIds, userAddress),
    enabled: !!thor && !!userAddress && !!proposalIds.length,
  })
}

export const getHasVotedProposalsInCurrentRoundQueryKey = (address?: string) => [
  "hasVotedProposalsInCurrentRound",
  address || "",
]

export const useHasVotedProposalsInCurrentRound = () => {
  const thor = useThor()
  const { account } = useWallet()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  return useQuery({
    queryKey: getHasVotedProposalsInCurrentRoundQueryKey(account?.address),
    queryFn: async () => {
      const proposals = await fetchContractEvents({
        thor,
        abi,
        contractAddress,
        eventName: "ProposalCreated" as const,
        filterParams: [BigInt(currentRoundId || "0")],
        mapResponse: ({ decodedData }) => ({
          id: decodedData.args.proposalId.toString(),
          description: decodedData.args.description,
        }),
      })
      const proposalIds = proposals.map(proposal => proposal.id)
      const hasVotedInRounds = await executeMultipleClausesCall({
        thor,
        calls: proposalIds.map(
          id =>
            ({
              abi,
              address: contractAddress,
              functionName,
              args: [id, account?.address as `0x${string}`],
            }) as const,
        ),
      })

      return Object.fromEntries(
        proposals.map((proposal, idx) => [
          proposal.id,
          { hasVoted: hasVotedInRounds[idx] ?? false, ipfsDescription: proposal.description },
        ]),
      )
    },
    enabled: !!thor && !!account?.address,
  })
}
