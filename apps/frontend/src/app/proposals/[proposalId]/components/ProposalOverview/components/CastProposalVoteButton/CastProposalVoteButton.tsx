import { ProposalState } from "@/api"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { VoteIcon } from "@/components"
import { Button } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/dapp-kit-react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

export const CastProposalVoteButton = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()
  const router = useRouter()
  const { account } = useWallet()
  const { open: openConnectModal } = useWalletModal()

  const hasVotesAtSnapshot = useMemo(() => {
    return Number(proposal.userVot3OnSnapshot ?? 0) > 0
  }, [proposal])

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

  const shouldSeeVoteButton = useMemo(() => {
    return proposal.state === ProposalState.Active && !!account && !proposal.hasUserVoted && hasVotesAtSnapshot
  }, [proposal, account, hasVotesAtSnapshot])

  if (shouldSeeVoteButton)
    return (
      <Button leftIcon={<VoteIcon boxSize={"16px"} color="white" />} onClick={handleClick} variant="primaryAction">
        {t("Cast your vote")}
      </Button>
    )

  return null
}
