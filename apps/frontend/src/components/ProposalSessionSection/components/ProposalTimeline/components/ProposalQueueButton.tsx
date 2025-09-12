import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { useQueueProposal } from "@/hooks/useQueueProposal"
import { Button } from "@chakra-ui/react"
import { t } from "i18next"
import { useCallback } from "react"

export const ProposalQueueButton = () => {
  const { proposal } = useProposalDetail()
  const queueMutation = useQueueProposal({ proposalId: proposal.id })
  const queueProposal = useCallback(() => {
    queueMutation.sendTransaction()
  }, [queueMutation])
  return (
    <Button my="2" onClick={queueProposal} variant={"primary"}>
      {t("Queue Proposal")}
    </Button>
  )
}
