import { ProposalState } from "@/api"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"

import { Button, Icon } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/dapp-kit-react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { MdHowToVote } from "react-icons/md"

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
      <Button
        leftIcon={<Icon as={MdHowToVote} boxSize={4} />}
        onClick={handleClick}
        variant="primaryAction"
        w={["full", "auto"]}
        size={["lg", "md"]}>
        {t("Cast your vote")}
      </Button>
    )

  return null
}
