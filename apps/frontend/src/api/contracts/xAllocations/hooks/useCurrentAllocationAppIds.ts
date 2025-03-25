import { useConnex } from "@vechain/vechain-kit"
import { useQuery } from "@tanstack/react-query"
import { getAppIdsOfRound } from "../getAppIdsOfRound"
import { useCurrentAllocationsRoundId } from "./useCurrentAllocationsRoundId"

/**
 * Query key for the current allocation appIds query
 * @param roundId - The roundId
 * @returns The query key
 */
export const getCurrentAllocationAppIdsQueryKey = (roundId?: string) => ["currentAllocationAppIds", roundId]

/**
 * Hook to get the appIds participating in allocations for the current round
 * @returns The appIds participating in allocations for the current round
 */
export const useCurrentAllocationAppIds = () => {
  const { thor } = useConnex()
  const { data: currentRoundId, isLoading: isCurrentRoundIdLoading } = useCurrentAllocationsRoundId()

  return useQuery({
    queryKey: getCurrentAllocationAppIdsQueryKey(currentRoundId),
    queryFn: async () => await getAppIdsOfRound(thor, currentRoundId),
    enabled: !!currentRoundId && !isCurrentRoundIdLoading,
  })
}
