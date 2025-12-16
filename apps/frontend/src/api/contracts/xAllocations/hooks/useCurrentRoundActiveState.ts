import { useMemo } from "react"

import { useAllocationsRound } from "./useAllocationsRound"
import { useCurrentAllocationsRoundId } from "./useCurrentAllocationsRoundId"

/**
 * Hook to get the active state of the current round
 * @returns the active state of the current round
 */
export const useCurrentRoundActiveState = () => {
  const { data: currentRoundId, isLoading } = useCurrentAllocationsRoundId()
  const { data: currentRound, isLoading: isLoadingData } = useAllocationsRound(currentRoundId)
  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === 0
  }, [currentRound])
  return { isLoading: isLoading || isLoadingData, isCurrentRoundActive, currentRound, currentRoundId }
}
