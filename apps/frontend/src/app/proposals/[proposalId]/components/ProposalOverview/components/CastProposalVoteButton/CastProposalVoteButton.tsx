import {
  useGetVotesOnBlock,
  useIsUserPerson,
  useProposalSnapshot,
  useProposalState,
  useUserSingleProposalVoteEvent,
  useVotingThreshold,
} from "@/api"

import { Button, Icon } from "@chakra-ui/react"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { MdHowToVote } from "react-icons/md"
import { ProposalState } from "@/hooks/proposals/grants/types"

type Props = {
  proposalId: string
}
export const CastProposalVoteButton = ({ proposalId }: Props) => {
  const router = useRouter()
  const { t } = useTranslation()
  const { account } = useWallet()
  const { open: openConnectModal } = useWalletModal()
  const { data: isPerson, isLoading: isPersonLoading } = useIsUserPerson()

  const { data: userVote, isLoading: userVoteLoading } = useUserSingleProposalVoteEvent(proposalId)
  const { data: state } = useProposalState(proposalId)
  const { data: snapshotBlock } = useProposalSnapshot(proposalId)
  const { data: userSnapshot } = useGetVotesOnBlock(
    snapshotBlock ? Number(snapshotBlock) : undefined,
    account?.address ?? undefined,
  )
  const { data: threhsold } = useVotingThreshold()

  const hasVotesAtSnapshot = useMemo(() => {
    return Number(userSnapshot ?? 0) >= Number(threhsold ?? 0)
  }, [userSnapshot, threhsold])

  const goToProposalVote = useCallback(() => {
    router.push(`/proposals/${proposalId}/vote`)
  }, [proposalId, router])

  const handleClick = useCallback(() => {
    if (!account?.address) {
      openConnectModal()
      return
    }
    goToProposalVote()
  }, [account, goToProposalVote, openConnectModal])

  const shouldSeeVoteButton = useMemo(() => {
    return (
      state === ProposalState.Active &&
      !!account?.address &&
      !userVote &&
      !userVoteLoading &&
      hasVotesAtSnapshot &&
      !isPersonLoading &&
      isPerson
    )
  }, [state, account, userVote, userVoteLoading, hasVotesAtSnapshot, isPerson, isPersonLoading])

  if (shouldSeeVoteButton)
    return (
      <Button onClick={handleClick} variant="primaryAction" w={["full", "auto"]} size={["lg", "md"]}>
        <Icon as={MdHowToVote} boxSize={4} />
        {t("Cast your vote")}
      </Button>
    )

  return null
}
