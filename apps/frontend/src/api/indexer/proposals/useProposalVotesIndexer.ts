import { getConfig } from "@repo/config"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"
import { z } from "zod"

const indexerUrl = getConfig().indexerUrl

export const ProposalVotesSchema = z.object({
  proposalId: z.string(),
  support: z.enum(["FOR", "AGAINST", "ABSTAIN"]),
  voters: z.number(),
  totalWeight: z.string(),
  totalPower: z.string(),
})

export const ProposalVotesResponseSchema = z.array(ProposalVotesSchema)

export type ProposalVotes = z.infer<typeof ProposalVotesSchema>
export type ProposalVotesResponse = z.infer<typeof ProposalVotesResponseSchema>

type ProposalVotesRequest = {
  proposalId: string
}

/**
 * Fetches the voting results for a specific proposal from the indexer.
 *
 * @param data - The request data containing the proposal ID.
 * @returns A promise that resolves to the proposal votes response.
 * @throws Will throw an error if the indexer URL is not found or if the proposal ID is missing.
 * @throws Will throw an error if the fetch request fails.
 */
export const getProposalVotesIndexer = async (data: ProposalVotesRequest): Promise<ProposalVotesResponse> => {
  if (!indexerUrl) throw new Error("Indexer URL not found")
  if (!data.proposalId) throw new Error("proposalId is required")

  const response = await fetch(`${indexerUrl}/voting/proposals/${data.proposalId}/results`, {
    method: "GET",
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch proposal votes: ${response.statusText}`)
  }

  return ProposalVotesResponseSchema.parse(await response.json())
}

export const getProposalVotesQueryKey = (proposalId: string) => ["PROPOSAL", "VOTES", proposalId]

/**
 * Hook to get the proposal votes from the indexer (i.e the number of votes for, against and abstain)
 * @param proposalId the proposal id to get the votes for
 * @returns the proposal votes {@link ProposalVotes}
 */
export const useProposalVotesIndexer = ({ proposalId }: ProposalVotesRequest) => {
  return useQuery({
    queryKey: getProposalVotesQueryKey(proposalId),
    queryFn: () => getProposalVotesIndexer({ proposalId }),
    enabled: !!proposalId,
  })
}

type ParsedProposalVotesResponse = {
  totalVoters: number
  totalPower: bigint
  totalWeight: bigint
  votes: {
    for: {
      totalWeight: string
      voters: number
      percentage: number
    }
    against: {
      totalWeight: string
      voters: number
      percentage: number
    }
    abstain: {
      totalWeight: string
      voters: number
      percentage: number
    }
  }
}
export const useParsedProposalVotesIndexer = ({
  proposalId,
}: ProposalVotesRequest): UseQueryResult<ParsedProposalVotesResponse | undefined> => {
  const proposalVotesQuery = useProposalVotesIndexer({ proposalId })

  const parsedProposalVotes = useMemo(() => {
    if (!proposalVotesQuery.data) return undefined

    const forVotes = proposalVotesQuery.data.find(vote => vote.support.toUpperCase() === "FOR")
    const againstVotes = proposalVotesQuery.data.find(vote => vote.support.toUpperCase() === "AGAINST")
    const abstainVotes = proposalVotesQuery.data.find(vote => vote.support.toUpperCase() === "ABSTAIN")

    const totalVoters = proposalVotesQuery.data.reduce((acc, vote) => acc + vote.voters, 0)
    const totalPower = proposalVotesQuery.data.reduce((acc, vote) => BigInt(acc) + BigInt(vote.totalPower), BigInt(0))
    const totalWeight = proposalVotesQuery.data.reduce((acc, vote) => BigInt(acc) + BigInt(vote.totalWeight), BigInt(0))

    const forVotesPercentage =
      Number(BigInt(BigInt(forVotes?.totalWeight ?? 0) * BigInt(10000)) / BigInt(totalWeight)) / 100
    const againstVotesPercentage =
      Number(BigInt(BigInt(againstVotes?.totalWeight ?? 0) * BigInt(10000)) / BigInt(totalWeight)) / 100
    const abstainVotesPercentage =
      Number(BigInt(BigInt(abstainVotes?.totalWeight ?? 0) * BigInt(10000)) / BigInt(totalWeight)) / 100

    return {
      totalVoters,
      totalPower,
      totalWeight,
      votes: {
        for: {
          totalWeight: forVotes?.totalWeight ?? "0",
          voters: forVotes?.voters ?? 0,
          percentage: forVotesPercentage,
        },
        against: {
          totalWeight: againstVotes?.totalWeight ?? "0",
          voters: againstVotes?.voters ?? 0,
          percentage: againstVotesPercentage,
        },
        abstain: {
          totalWeight: abstainVotes?.totalWeight ?? "0",
          voters: abstainVotes?.voters ?? 0,
          percentage: abstainVotesPercentage,
        },
      },
    }
  }, [proposalVotesQuery.data])

  return {
    ...proposalVotesQuery,
    data: parsedProposalVotes,
  }
}
