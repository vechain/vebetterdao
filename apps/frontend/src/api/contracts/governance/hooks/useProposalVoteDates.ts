import { useCurrentBlock } from "@/api/blockchain"
import { useProposalCreatedEvent } from "./useProposalCreatedEvent"
import { useMemo } from "react"
import { getConfig } from "@repo/config"
import dayjs from "dayjs"
import { useProposalSnapshot } from "./useProposalSnapshot"
import { useProposalDeadline } from "./useProposalDeadline"

const blockTime = getConfig().network.blockTime

export const useProposalVoteDates = (proposalId: string) => {
  const { data: currentBlock } = useCurrentBlock()
  const proposalSnapshot = useProposalSnapshot(proposalId)
  const proposalDeadline = useProposalDeadline(proposalId)

  const votingStartDate = useMemo(() => {
    if (!currentBlock || !proposalSnapshot.data) return 0
    const endBlockFromNow = Number(proposalSnapshot.data) - currentBlock.number

    const durationLeftTimestamp = endBlockFromNow * blockTime
    return dayjs().add(durationLeftTimestamp, "milliseconds").toDate().getTime()
  }, [])

  const votingEndDate = useMemo(() => {
    if (!currentBlock || !proposalSnapshot.data) return 0
    const endBlockFromNow = Number(proposalDeadline.data) - currentBlock.number

    const durationLeftTimestamp = endBlockFromNow * blockTime
    return dayjs().add(durationLeftTimestamp, "milliseconds").toDate().getTime()
  }, [])

  return {
    votingStartBlock: proposalSnapshot.data,
    votingStartDate,
    isVotingStartDateLoading: proposalSnapshot.isLoading,
    votingEndBlock: proposalDeadline.data,
    votingEndDate,
    isVotingEndDateLoading: proposalDeadline.isLoading,
  }
}
