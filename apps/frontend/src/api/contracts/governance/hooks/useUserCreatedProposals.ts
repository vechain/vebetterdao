import { useConnex } from "@vechain/dapp-kit-react"

import { useQuery } from "@tanstack/react-query"
import { getProposalsCreatedEvents } from ".."

export const getUserProposalsCreatedEventsQueryKey = (user?: string) => ["PROPOSALS", "ALL", "CREATED", user]

/**
 * Custom hook that retrieves the created proposals of a specific user.
 * @returns An object containing information about the created proposals.
 */
export const useUserProposalsCreatedEvents = (user?: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getUserProposalsCreatedEventsQueryKey(user ?? undefined),
    queryFn: async () => {
      const { created } = await getProposalsCreatedEvents(thor, user ?? undefined)

      return created
    },
    enabled: !!thor || !!user,
  })
}
