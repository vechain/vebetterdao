import { useThor } from "@vechain/vechain-kit"
import { useQuery } from "@tanstack/react-query"
import { getProposalsCreatedEvents } from ".."
import { EnvConfig } from "@repo/config/contracts"

export const getUserProposalsCreatedEventsQueryKey = (user?: string) => ["PROPOSALS", "ALL", "CREATED", user]

/**
 * Custom hook that retrieves the created proposals of a specific user.
 * @param env - The environment config
 * @param user - The user address to filter proposals for
 * @returns An object containing information about the created proposals.
 */
export const useUserProposalsCreatedEvents = (env: EnvConfig, user?: string) => {
  const thor = useThor()

  return useQuery({
    queryKey: getUserProposalsCreatedEventsQueryKey(user ?? undefined),
    queryFn: async () => {
      const { created } = await getProposalsCreatedEvents(thor, env, user ?? undefined)
      return created
    },
    enabled: !!thor,
  })
}
