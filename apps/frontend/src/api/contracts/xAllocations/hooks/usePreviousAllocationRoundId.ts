import { useQuery } from "@tanstack/react-query"

import { useCurrentAllocationsRoundId } from "./useCurrentAllocationsRoundId"

export const getPreviousAllocationRoundId = () => ["PREVIOUS_ALLOCATION_ROUND_ID"]
/**
 * Returns the previous allocation round id
 *
 * @returns the previous allocation round id
 */
export const usePreviousAllocationRoundId = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  return useQuery({
    queryKey: getPreviousAllocationRoundId(),
    queryFn: async () => {
      if (!currentRoundId) return "1" // default to 1
      if (Number(currentRoundId) <= 1) return currentRoundId
      return (Number(currentRoundId) - 1).toString()
    },
    enabled: !!currentRoundId,
  })
}
