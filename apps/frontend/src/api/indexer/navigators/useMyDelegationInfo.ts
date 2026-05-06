import { useWallet } from "@vechain/vechain-kit"

import { indexerQueryClient } from "../api"

/**
 * Fetches the earliest delegation event for the connected user toward a specific navigator.
 * Used to display "delegating since …" context on the navigator detail page.
 */
export const useMyDelegationInfo = (navigatorAddress: string) => {
  const { account } = useWallet()
  const citizen = account?.address ?? ""

  return indexerQueryClient.useQuery(
    "get",
    "/api/v1/b3tr/navigators/delegations",
    {
      params: { query: { navigator: navigatorAddress, citizen, size: 1, direction: "ASC" } },
      enabled: !!citizen && !!navigatorAddress,
    },
    {
      select: data => {
        const first = data?.data?.[0]
        if (!first) return undefined
        return { delegatedAt: first.blockTimestamp }
      },
    },
  )
}
