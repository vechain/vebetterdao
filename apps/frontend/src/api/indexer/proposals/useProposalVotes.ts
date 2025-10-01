import { paths } from "../schema"
import BigNumber from "bignumber.js"

import { indexerQueryClient } from "../api"

type ProposalVotesQuery = paths["/api/v1/b3tr/proposals/{proposalId}/results"]["get"]

type ProposalVotesQueryResponse = ProposalVotesQuery["responses"]["200"]["content"]["*/*"]

export type ProposalVotes = ProposalVotesQueryResponse[number]

export type GroupedProposalVotes = Record<
  Lowercase<ProposalVotes["support"]>,
  {
    totalWeight: bigint
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
        const totalPower = data.reduce((acc, item) => acc.plus(BigNumber(item.totalPower ?? 0)), BigNumber(0))
        const totalVoters = data.reduce((acc, item) => acc + item.voters, 0)
        const totalWeight = data.reduce((acc, item) => acc.plus(BigNumber(item.totalWeight ?? 0)), BigNumber(0))

        const groupedVotes = data.reduce((acc, item) => {
          const itemWeight = BigNumber(item.totalWeight ?? 0)
          const itemPower = BigNumber(item.totalPower ?? 0)

          // Calculate percentages as (item / total) * 100 using BigNumber math
          const percentage = totalWeight.isGreaterThan(0)
            ? itemWeight.dividedBy(totalWeight).multipliedBy(100).toNumber()
            : 0
          const percentagePower = totalPower.isGreaterThan(0)
            ? itemPower.dividedBy(totalPower).multipliedBy(100).toNumber()
            : 0

          acc[item.support.toLowerCase() as Lowercase<ProposalVotes["support"]>] = {
            totalWeight: BigInt(itemWeight?.toFixed() ?? "0"),
            voters: item.voters,
            percentage,
            percentagePower,
          }
          return acc
        }, {} as GroupedProposalVotes)

        return {
          totalVoters,
          totalPower: BigInt(totalPower?.toFixed() ?? "0"), //Convert to big int without loosing precision
          totalWeight: BigInt(totalWeight?.toFixed() ?? "0"), //Convert to big int without loosing precision
          votes: groupedVotes,
        }
      },
      refetchInterval: 10000,
    },
  )
