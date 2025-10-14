import { useAppIdsOfRound } from "../getAppIdsOfRound"

import { useCurrentAllocationsRoundId } from "./useCurrentAllocationsRoundId"

/**
 * Hook to get the appIds participating in allocations for the current round
 * @returns The appIds participating in allocations for the current round
 */
export const useCurrentAllocationAppIds = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  return useAppIdsOfRound(currentRoundId?.toString())
}
