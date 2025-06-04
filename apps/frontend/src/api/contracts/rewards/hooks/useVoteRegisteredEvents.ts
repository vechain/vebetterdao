import { getConfig } from "@repo/config"
import { VoterRewards__factory } from "@repo/contracts/typechain-types"
import { getAllEventLogs, ThorClient, useThor } from "@vechain/vechain-kit"
import { FilterCriteria } from "@vechain/sdk-network"
import { EnvConfig } from "@repo/config/contracts"
import { useQuery } from "@tanstack/react-query"
import { ethers } from "ethers"

export type VoteRegisteredEvent = {
  cycle: number
  voter: string
  votes: number
  rewardWeightedVote: number
}

/**
 * Fetches all VoteRegistered events
 * @param {ThorClient} thor - The thor client
 * @param {EnvConfig} env - The environment config
 * @param {object} filterOptions - Filter options for cycle and voter
 * @returns {Promise<VoteRegisteredEvent[]>}
 */
export const getVoteRegisteredEvents = async (
  thor: ThorClient,
  env: EnvConfig,
  filterOptions?: { cycle?: number; voter?: string },
): Promise<VoteRegisteredEvent[]> => {
  const voterRewardsContractAddress = getConfig(env).voterRewardsContractAddress

  const eventAbi = thor.contracts
    .load(voterRewardsContractAddress, VoterRewards__factory.abi)
    .getEventAbi("VoteRegistered")

  const topics = eventAbi.encodeFilterTopicsNoNull({
    cycle: filterOptions?.cycle ?? undefined,
    voter: filterOptions?.voter ?? undefined,
  })

  const filterCriteria: FilterCriteria[] = [
    {
      criteria: {
        address: voterRewardsContractAddress,
        topic0: topics[0] ?? undefined,
        topic1: topics[1] ?? undefined,
        topic2: topics[2] ?? undefined,
        topic3: topics[3] ?? undefined,
        topic4: topics[4] ?? undefined,
      },
      eventAbi,
    },
  ]

  const events = await getAllEventLogs({
    nodeUrl: thor.httpClient.baseURL,
    thor,
    from: 0,
    to: undefined,
    filterCriteria,
  })

  const decodedVoteRegisteredEvents: VoteRegisteredEvent[] = []

  events.forEach(event => {
    if (!event.decodedData) {
      throw new Error("Event data not decoded")
    }

    const [cycle, voter, votes, rewardWeightedVote] = event.decodedData as [bigint, string, bigint, bigint]
    const rewardWeightedVoteFormatted = Number(ethers.formatEther(rewardWeightedVote))

    decodedVoteRegisteredEvents.push({
      cycle: Number(cycle),
      voter,
      votes: Number(votes),
      rewardWeightedVote: rewardWeightedVoteFormatted,
    })
  })

  return decodedVoteRegisteredEvents
}

export const getVoteRegisteredEventsQueryKey = (env: EnvConfig, filterOptions?: { cycle?: number; voter?: string }) => {
  return ["voteRegisteredEvents", env, filterOptions]
}

/**
 * Hook to get all VoteRegistered events from the Voter Rewards contract
 * @param {EnvConfig} env - The environment config
 * @param {object} filterOptions - Filter options for cycle and voter
 * @returns {UseQueryResult<VoteRegisteredEvent[], Error>}
 */
export const useVoteRegisteredEvents = (env: EnvConfig, filterOptions?: { cycle?: number; voter?: string }) => {
  const thor = useThor()

  const result = useQuery({
    queryKey: getVoteRegisteredEventsQueryKey(env, filterOptions),
    enabled: !!thor,
    queryFn: async () => {
      if (!thor) throw new Error("Thor client not available")
      return getVoteRegisteredEvents(thor, env, filterOptions)
    },
  })

  return result
}
