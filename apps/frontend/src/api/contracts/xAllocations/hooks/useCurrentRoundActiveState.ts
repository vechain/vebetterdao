import { useMemo } from "react"
import { useCurrentAllocationsRoundId } from "./useCurrentAllocationsRoundId"
import { useAllocationsRound } from "./useAllocationsRound"

/**
 * Hook to get the active state of the current round
 * @returns the active state of the current round
 */
export const useCurrentRoundActiveState = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId)

  const isCurrentRoundActive = useMemo(() => {
    return currentRound?.state === 0
  }, [currentRound])

  return { isCurrentRoundActive, currentRound, currentRoundId }
}
