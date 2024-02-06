import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

export const currentBlockQueryKey = () => ["CURRENT_BLOCK"]

/**
 *
 * @returns  the current block
 */
export const useCurrentBlock = () => {
  const { thor } = useConnex()
  return useQuery({
    queryKey: currentBlockQueryKey(),
    queryFn: () => thor.status.head,
    enabled: !!thor,
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 10,
  })
}
