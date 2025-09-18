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

export const getProposalVotesQuerykey = (proposalId: string) => ["proposalVotes", proposalId]

export const useProposalVotes = (proposalId: string) =>
  indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/proposals/{proposalId}/results",
    {
      queryKey: getProposalVotesQuerykey(proposalId),
      params: { path: { proposalId } },
    },
    {
      select(data) {
        const totalPower = data.reduce((acc, item) => acc + item.totalPower, 0)
        const totalVoters = data.reduce((acc, item) => acc + item.voters, 0)
        const totalWeight = data.reduce((acc, item) => acc + item.totalWeight, 0)

        const groupedVotes = data.reduce((acc, item) => {
          acc[item.support.toLowerCase() as Lowercase<ProposalVotes["support"]>] = {
            totalWeight: item.totalWeight,
            voters: item.voters,
            percentage: item.totalWeight / totalWeight,
            percentagePower: item.totalPower / totalPower,
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
    },
  )
