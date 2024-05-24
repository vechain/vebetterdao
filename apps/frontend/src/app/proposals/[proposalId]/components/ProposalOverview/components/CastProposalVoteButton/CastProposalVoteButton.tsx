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

  if (proposal.state === ProposalState.Active && !proposal.haveYouVoted) {
    return (
      <Button
        leftIcon={<VoteIcon />}
        onClick={goToProposalVote}
        bgColor={"#004CFC"}
        disabled={proposal.isDepositReached}
        color={"#FFFFFF"}
        rounded={"full"}
        fontSize={"16px"}
        fontWeight={500}
        px="24px">
        {t("Cast your vote")}
      </Button>
    )
  }
  return null
}
