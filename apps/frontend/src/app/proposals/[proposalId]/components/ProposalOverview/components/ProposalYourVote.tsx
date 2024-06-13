import { VoteType } from "@/api"
import { HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../../hooks"

export const ProposalYourVote = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()

  switch (Number(proposal.userVote?.support)) {
    case VoteType.VOTE_FOR:
      return (
        <VStack alignItems={"stretch"}>
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
        </VStack>
      )
    case VoteType.VOTE_AGAINST:
      return (
        <VStack alignItems={"stretch"}>
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
        </VStack>
      )
    case VoteType.ABSTAIN:
      return (
        <VStack alignItems={"stretch"}>
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
        </VStack>
      )
    default:
      return null
  }
}
