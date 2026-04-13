import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"

export const useBestBlockCompressed = () => {
  const thor = useThor()

  return useQuery({
    queryKey: ["bestBlockCompressed"],
    queryFn: () => thor.blocks.getBestBlockCompressed(),
    enabled: !!thor,
    refetchInterval: 30_000,
  })
}
