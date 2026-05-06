import { useMemo } from "react"

import { useGetPreferenceCutoffPeriod } from "@/api/contracts/navigatorRegistry/hooks/useGetPreferenceCutoffPeriod"
import { useCurrentAllocationsRoundDeadline } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundDeadline"
import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { blockNumberToDate } from "@/utils/date"

export const useNavigatorCutoffDeadline = () => {
  const { data: deadlineBlock } = useCurrentAllocationsRoundDeadline()
  const { data: cutoffPeriod } = useGetPreferenceCutoffPeriod()
  const { data: bestBlock } = useBestBlockCompressed()

  return useMemo(() => {
    if (deadlineBlock == null || cutoffPeriod == null || !bestBlock) {
      return { cutoffDate: null, isPastCutoff: false, cutoffBlock: null }
    }

    const cutoffBlock = BigInt(deadlineBlock) - BigInt(cutoffPeriod)
    const cutoffDate = blockNumberToDate(cutoffBlock, bestBlock)
    const isPastCutoff = BigInt(bestBlock.number) >= cutoffBlock

    return { cutoffDate, isPastCutoff, cutoffBlock: Number(cutoffBlock) }
  }, [deadlineBlock, cutoffPeriod, bestBlock])
}
