import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

export const currentBlockQueryKey = () => ["CURRENT_BLOCK"]

const nodeUrl = getConfig().nodeUrl

/**
 *
 * @returns  the current block
 */
export const useCurrentBlock = () => {
  const { thor } = useConnex()

  thor.status.head
  return useQuery({
    queryKey: currentBlockQueryKey(),
    queryFn: async () => {
      const response = await fetch(`${nodeUrl}/blocks/best`, {
        method: "GET",
      })
      if (!response.ok) throw new Error(response.statusText)
      return (await response.json()) as Connex.Thor.Block
    },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 10,
  })
}
