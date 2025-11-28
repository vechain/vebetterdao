import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { parseEther } from "viem"

import { useCurrentRoundSnapshot } from "../../xAllocations/hooks/useCurrentRoundSnapshot"

import { useTotalVotesOnBlock } from "./useTotalVotesOnBlock"

/**
 * Hook to get the user's voting power at the current allocation round snapshot
 * @returns Object containing raw voting power, formatted values, and loading state
 */
export const useVotingPowerAtSnapshot = () => {
  const { account } = useWallet()

  // Get current round snapshot block
  const { data: snapshotBlock } = useCurrentRoundSnapshot()

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
      original: parseEther(votesAtSnapshot.totalVotesWithDeposits).toString(),
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
