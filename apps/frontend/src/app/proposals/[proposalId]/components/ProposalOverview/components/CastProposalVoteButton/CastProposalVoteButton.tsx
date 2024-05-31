import { ProposalState, useCurrentProposal } from "@/api"
import { VoteIcon } from "@/components"
import { Button } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const CastProposalVoteButton = () => {
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()
  const router = useRouter()

  const goToProposalVote = useCallback(() => {
    router.push(`/proposals/${proposal.id}/vote`)
  }, [proposal.id, router])

  if (proposal.state === ProposalState.Active && !proposal.hasUserVoted) {
    return (
      <Button leftIcon={<VoteIcon />} onClick={goToProposalVote} variant="primaryAction">
        {t("Cast your vote")}
      </Button>
    )
  }
  return null
}
