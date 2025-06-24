import { useMemo } from "react"
import { getConfig } from "@repo/config"
import dayjs from "dayjs"
import { useProposalSnapshot } from "./useProposalSnapshot"
import { useProposalDeadline } from "./useProposalDeadline"
import { useCurrentBlock } from "@vechain/vechain-kit"

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
  }, [currentBlock?.id, proposalSnapshot.data])

  const votingEndDate = useMemo(() => {
    if (!currentBlock || !proposalSnapshot.data) return 0
    const endBlockFromNow = Number(proposalDeadline.data) - currentBlock.number

    const durationLeftTimestamp = endBlockFromNow * blockTime
    return dayjs().add(durationLeftTimestamp, "milliseconds").toDate().getTime()
  }, [currentBlock?.id, proposalDeadline.data, proposalSnapshot.data])

  return {
    votingStartBlock: proposalSnapshot.data,
    votingStartDate,
    isVotingStartDateLoading: proposalSnapshot.isLoading,
    votingEndBlock: proposalDeadline.data,
    votingEndDate,
    isVotingEndDateLoading: proposalDeadline.isLoading,
  }
}
