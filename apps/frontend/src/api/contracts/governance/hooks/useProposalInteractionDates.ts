import { useMemo } from "react"
import { getConfig } from "@repo/config"
import dayjs from "dayjs"
import { useProposalSnapshot } from "./useProposalSnapshot"
import { useProposalDeadline } from "./useProposalDeadline"
import { useCurrentBlock } from "@vechain/vechain-kit"
import { ProposalEnriched } from "@/hooks/proposals/grants/types"

const blockTime = getConfig().network.blockTime

export const useProposalInteractionDates = (proposal: ProposalEnriched) => {
  const { data: currentBlock } = useCurrentBlock()
  const proposalSnapshot = useProposalSnapshot(proposal.id) //This is the end of support phase / start of voting phase
  const proposalDeadline = useProposalDeadline(proposal.id) //This is the end of voting phase / start of execution phase

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
