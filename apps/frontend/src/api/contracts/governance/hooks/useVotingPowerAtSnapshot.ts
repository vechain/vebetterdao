import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useAllocationRoundSnapshot } from "../../xAllocations/hooks/useAllocationRoundSnapshot"
import { useCurrentAllocationsRoundId } from "../../xAllocations/hooks/useCurrentAllocationsRoundId"

import { useTotalVotesOnBlock } from "./useTotalVotesOnBlock"

/**
 * Hook to get the user's voting power at the current allocation round snapshot
 * @returns Object containing raw voting power, formatted values, and loading state
 */
export const useVotingPowerAtSnapshot = () => {
  const { account } = useWallet()

  // Get current round ID and its snapshot block
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: snapshotBlock } = useAllocationRoundSnapshot(currentRoundId ?? "")

  // Get VOT3 balance at snapshot block
  const { data: votesAtSnapshot, isLoading } = useTotalVotesOnBlock(
    snapshotBlock ? Number(snapshotBlock) : undefined,
    account?.address,
  )

  // Format the balance for display
  const vot3Balance = useMemo(() => {
    if (!votesAtSnapshot?.totalVotesWithDeposits) return undefined
    const scaled = votesAtSnapshot.totalVotesWithDeposits
    const formatted = scaled === "0" ? "0" : FormattingUtils.humanNumber(scaled)
    return {
      original: scaled,
      scaled,
      formatted,
    }
  }, [votesAtSnapshot])

  return {
    vot3Balance,
    isLoading,
    votesAtSnapshot,
  }
}
