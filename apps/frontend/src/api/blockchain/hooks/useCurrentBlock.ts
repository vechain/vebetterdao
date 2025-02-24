import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"

const nodeUrl = getConfig().nodeUrl

export const getCurrentBlock = async () => {
  const response = await fetch(`${nodeUrl}/blocks/best`, {
    method: "GET",
  })
  if (!response.ok) throw new Error(response.statusText)
  return (await response.json()) as Connex.Thor.Block
}

export const currentBlockQueryKey = () => ["CURRENT_BLOCK"]

/**
 * Fetches the current block from the blockchain. The block is refetched every 10 seconds.
 * @returns the current block
 */
export const useCurrentBlock = () => {
  return useQuery({
    queryKey: currentBlockQueryKey(),
    queryFn: async () => getCurrentBlock(),
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 10,
  })
}
