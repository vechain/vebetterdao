import { paths } from "../schema"
import { indexerQueryClient } from "../api"

type ProposalVotesQuery = paths["/api/v1/b3tr/proposals/{proposalId}/results"]["get"]

type ProposalVotesQueryResponse = ProposalVotesQuery["responses"]["200"]["content"]["*/*"]

export type ProposalVotes = ProposalVotesQueryResponse[number]

export type GroupedProposalVotes = Record<
  Lowercase<ProposalVotes["support"]>,
  {
    totalWeight: number
    voters: number
    percentage: number
    percentagePower: number
  }
>

export const getProposalVotesQueryKey = (proposalId: string) => ["proposalVotes", proposalId]

export const useProposalVotes = (proposalId: string) =>
  indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/proposals/{proposalId}/results",
    {
      queryKey: getProposalVotesQueryKey(proposalId),
      params: { path: { proposalId } },
    },
    {
      select(data) {
        const totalPower = data.reduce((acc, item) => acc + BigInt(item.totalPower), BigInt(0))
        const totalVoters = data.reduce((acc, item) => acc + item.voters, 0)
        const totalWeight = data.reduce((acc, item) => acc + BigInt(item.totalWeight), BigInt(0))

        const groupedVotes = data.reduce((acc, item) => {
          acc[item.support.toLowerCase() as Lowercase<ProposalVotes["support"]>] = {
            totalWeight: Number(item.totalWeight),
            voters: item.voters,
            percentage: Number(BigInt(BigInt(item?.totalWeight ?? 0) * BigInt(10000)) / BigInt(totalWeight)) / 100,
            percentagePower: Number((BigInt(item?.totalPower ?? 0) * BigInt(10000)) / BigInt(totalPower)) / 100,
          }
          return acc
        }, {} as GroupedProposalVotes)

        return {
          totalVoters,
          totalPower,
          totalWeight,
          votes: groupedVotes,
        }
      },
      refetchInterval: 10000,
    },
  )
