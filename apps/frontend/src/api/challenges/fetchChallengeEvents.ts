import { QueryClient } from "@tanstack/react-query"
import { ThorClient } from "@vechain/sdk-network"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { ContractEventArgs, ContractEventName } from "viem"

import { fetchContractEvents } from "@/api/contracts/governance/fetchContractEvents"

const challengesAbi = B3TRChallenges__factory.abi
type ChallengesAbi = typeof challengesAbi

export type ChallengeEventResult<K extends ContractEventName<ChallengesAbi>> = Awaited<
  ReturnType<typeof fetchContractEvents<ChallengesAbi, K>>
>[number]

interface FetchChallengeEventsParams<K extends ContractEventName<ChallengesAbi>> {
  thor: ThorClient
  queryClient: QueryClient
  contractAddress: string
  fromBlock: number
  eventName: K
  filterParams?: ContractEventArgs<ChallengesAbi, K>
}

const makeQueryKey = <K extends ContractEventName<ChallengesAbi>>(
  eventName: K,
  contractAddress: string,
  filterParams?: ContractEventArgs<ChallengesAbi, K>,
) => {
  const normalized =
    filterParams && typeof filterParams === "object"
      ? Object.entries(filterParams as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, typeof v === "string" ? v.toLowerCase() : v])
      : null
  return ["challenges", "events", contractAddress.toLowerCase(), eventName, normalized] as const
}

/**
 * Fetches B3TRChallenges events with shared React Query caching.
 * Event logs rarely change for historical blocks — cached aggressively.
 */
export const fetchChallengeEvents = async <K extends ContractEventName<ChallengesAbi>>({
  thor,
  queryClient,
  contractAddress,
  fromBlock,
  eventName,
  filterParams,
}: FetchChallengeEventsParams<K>): Promise<ChallengeEventResult<K>[]> => {
  return queryClient.fetchQuery({
    queryKey: makeQueryKey(eventName, contractAddress, filterParams),
    queryFn: () =>
      fetchContractEvents<ChallengesAbi, K>({
        thor,
        abi: challengesAbi,
        contractAddress,
        eventName,
        filterParams,
        from: fromBlock,
        order: "asc",
      }),
    staleTime: 30 * 1000,
  })
}
