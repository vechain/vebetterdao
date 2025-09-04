import { getConfig } from "@repo/config"
import { useCurrentBlock } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useMemo } from "react"

import { useProposalDeadline } from "./useProposalDeadline"
import { useProposalSnapshot } from "./useProposalSnapshot"

const blockTime = getConfig().network.blockTime

export const useProposalInteractionDates = (proposalId: string) => {
  const { data: currentBlock } = useCurrentBlock()
  const proposalSnapshot = useProposalSnapshot(proposalId) //This is the end of support phase / start of voting phase
  const proposalDeadline = useProposalDeadline(proposalId) //This is the end of voting phase / start of execution phase

  const supportEndDate = useMemo(() => {
    if (!currentBlock?.number || !proposalSnapshot.data) return 0
    const endBlockFromNow = Number(proposalSnapshot.data) - currentBlock.number

    const durationLeftTimestamp = endBlockFromNow * blockTime
    return dayjs().add(durationLeftTimestamp, "milliseconds").toDate().getTime()
  }, [currentBlock?.number, proposalSnapshot.data])

  const votingEndDate = useMemo(() => {
    if (!currentBlock?.number || !proposalSnapshot.data) return 0
    const endBlockFromNow = Number(proposalDeadline.data) - currentBlock.number

    const durationLeftTimestamp = endBlockFromNow * blockTime
    return dayjs().add(durationLeftTimestamp, "milliseconds").toDate().getTime()
  }, [currentBlock?.number, proposalDeadline.data, proposalSnapshot.data])

  return {
    supportEndDate,
    votingEndDate,
  }
}
