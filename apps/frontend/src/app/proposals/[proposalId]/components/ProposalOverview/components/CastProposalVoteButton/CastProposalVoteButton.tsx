import { ProposalState } from "@/api"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { VoteIcon } from "@/components"
import { Button } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/dapp-kit-react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const CastProposalVoteButton = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { open: openConnectModal } = useWalletModal()

  const goToProposalVote = useCallback(() => {
    router.push(`/proposals/${proposal.id}/vote`)
  }, [proposal.id, router])

  const handleClick = useCallback(() => {
    if (!account) {
      openConnectModal()
      return
    }
    goToProposalVote()
  }, [account, goToProposalVote, openConnectModal])

  if (proposal.state === ProposalState.Active && !proposal.hasUserVoted) {
    return (
      <Button leftIcon={<VoteIcon />} onClick={handleClick} variant="primaryAction">
        {t("Cast your vote")}
      </Button>
    )
  }
  return null
}
