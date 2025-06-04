import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { getProposalsEvents } from "../getProposalsEvents"
import { EnvConfig } from "@repo/config/contracts"

export const getProposalsEventsQueryKey = (env: EnvConfig, proposalId = "all") => ["proposalsEvents", env, proposalId]

/**
 * Hook to get the proposals events from the governor contract (i.e the proposals created, canceled and executed)
 * @param env - The environment config
 * @param proposalId - Optional proposal ID to filter events
 * @returns The proposals events
 */
export const useProposalsEvents = (env: EnvConfig, proposalId?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getProposalsEventsQueryKey(env, proposalId),
    queryFn: async () => await getProposalsEvents(thor, env, proposalId),
    enabled: !!thor,
  })
}
