import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { useCurrentBlock } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useMemo } from "react"

import { useProposalDeadline } from "./useProposalDeadline"
import { useProposalSnapshot } from "./useProposalSnapshot"

const blockTime = getConfig().network.blockTime

export const getProposalInteractionDatesQueryKey = (
  proposalId: string,
  currentBlockNumber?: number,
  snapshotBlock?: string,
  deadlineBlock?: string,
) => ["proposal-interaction-dates", proposalId, currentBlockNumber, snapshotBlock, deadlineBlock]

/**
 * Hook to calculate proposal interaction dates (support end date and voting end date)
 * @param proposalId The ID of the proposal
 * @returns Object containing supportEndDate, votingEndDate, and supportStartBlock
 */
export const useProposalInteractionDates = (proposalId: string) => {
  const { data: currentBlock } = useCurrentBlock()
  const proposalSnapshot = useProposalSnapshot(proposalId) //This is the end of support phase / start of voting phase
  const proposalDeadline = useProposalDeadline(proposalId) //This is the end of voting phase / start of execution phase

  const supportStartBlock = useMemo(() => {
    if (!currentBlock?.number || !proposalSnapshot.data) return 0
    return Number(proposalSnapshot.data)
  }, [currentBlock?.number, proposalSnapshot.data])

  const { data: calculatedDates } = useQuery({
    queryKey: getProposalInteractionDatesQueryKey(
      proposalId,
      currentBlock?.number,
      proposalSnapshot.data,
      proposalDeadline.data,
    ),
    queryFn: () => {
      if (!currentBlock?.number || !proposalSnapshot.data || !proposalDeadline.data) {
        return { supportEndDate: 0, votingEndDate: 0 }
      }

      const currentBlockNumber = currentBlock.number

      // Calculate support end date
      const supportEndBlockFromNow = Number(proposalSnapshot.data) - currentBlockNumber
      const supportDurationLeftTimestamp = supportEndBlockFromNow * blockTime
      const supportEndDate = dayjs().add(supportDurationLeftTimestamp, "milliseconds").toDate().getTime()

      // Calculate voting end date
      const votingEndBlockFromNow = Number(proposalDeadline.data) - currentBlockNumber
      const votingDurationLeftTimestamp = votingEndBlockFromNow * blockTime
      const votingEndDate = dayjs().add(votingDurationLeftTimestamp, "milliseconds").toDate().getTime()

      return { supportEndDate, votingEndDate }
    },
    staleTime: 1000 * 60, // 1 minute
  })

  return {
    supportEndDate: calculatedDates?.supportEndDate ?? 0,
    votingEndDate: calculatedDates?.votingEndDate ?? 0,
    supportStartBlock,
  }
}
