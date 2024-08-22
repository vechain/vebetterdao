import { ProposalState, VoteType } from "@/api"
import { Box, HStack, Icon, Image, Skeleton, Text } from "@chakra-ui/react"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../../hooks"
import { useMemo } from "react"
import { MdHowToVote } from "react-icons/md"
import { useWallet } from "@vechain/dapp-kit-react"

export const ProposalYourVote = () => {
  const { account } = useWallet()
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()

  const hasVotesAtSnapshot = useMemo(() => {
    return Number(proposal.userVot3OnSnapshot ?? 0) > 0
  }, [proposal])

  const shouldRender = useMemo(() => {
    return (
      account &&
      [
        ProposalState.Active,
        ProposalState.Defeated,
        ProposalState.Executed,
        ProposalState.Queued,
        ProposalState.Succeeded,
      ].includes(proposal.state as ProposalState)
    )
  }, [proposal, account])

  if (!shouldRender) return null

  if (!proposal.hasUserVoted)
    return (
      <Box>
        <Text color="#6A6A6A" fontSize={["lg", "lg", "md"]} fontWeight={400}>
          {t("Your vote")}
        </Text>
        <Skeleton isLoaded={!proposal.isUserVot3OnSnapshotLoading}>
          <HStack spacing={2}>
            <Icon as={MdHowToVote} boxSize={4} color={"#252525"} />

            <Text fontSize={["lg", "lg", "md"]} color={"#252525"} fontWeight={400}>
              {hasVotesAtSnapshot ? t("You have not voted") : t("No votes to cast")}
            </Text>
          </HStack>
        </Skeleton>
      </Box>
    )

  switch (Number(proposal.userVote?.support)) {
    case VoteType.VOTE_FOR:
      return (
        <Box>
          <Text fontWeight={"400"} color="#6A6A6A">
            {t("Your vote")}
          </Text>
          <Skeleton isLoaded={!proposal.isProposerLoading}>
            <HStack gap={1}>
              <UilThumbsUp size="20px" color="#38BF66" />
              <Text color="#252525" fontWeight={600}>
                {t("You voted")}
              </Text>
              <Text fontWeight={600}>{t("For")}</Text>
            </HStack>
          </Skeleton>
        </Box>
      )
    case VoteType.VOTE_AGAINST:
      return (
        <Box>
          <Text fontWeight={"400"} color="#6A6A6A">
            {t("Your vote")}
          </Text>
          <Skeleton isLoaded={!proposal.isProposerLoading}>
            <HStack gap={1}>
              <UilThumbsDown size="20px" color="#D23F63" />
              <Text color="#252525" fontWeight={600}>
                {t("You voted")}
              </Text>
              <Text fontWeight={600}>{t("Against")}</Text>
            </HStack>
          </Skeleton>
        </Box>
      )
    case VoteType.ABSTAIN:
      return (
        <Box>
          <Text fontWeight={"400"} color="#6A6A6A">
            {t("Your vote")}
          </Text>
          <Skeleton isLoaded={!proposal.isProposerLoading}>
            <HStack gap={1}>
              <Image src={"/images/abstained.svg"} alt="abstained" />
              <Text color="#252525" fontWeight={600}>
                {t("You voted")}
              </Text>
              <Text fontWeight={600}>{t("Abstain")}</Text>
            </HStack>
          </Skeleton>
        </Box>
      )
    default:
      return null
  }
}
