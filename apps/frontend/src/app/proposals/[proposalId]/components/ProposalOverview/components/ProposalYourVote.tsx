import { useCurrentProposal } from "@/api"
import { HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilArrowUpRight, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const ProposalYourVote = () => {
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()

  // TODO: Implement logic
  return null
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
          <Text color="#B59525" fontWeight={600}>
            {t("Abstain")}
          </Text>
          <UilArrowUpRight size="20px" color="#004CFC" />
        </HStack>
      </Skeleton>
    </VStack>
  )

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
          <Text color="#D23F63" fontWeight={600}>
            {t("Against")}
          </Text>
          <UilArrowUpRight size="20px" color="#004CFC" />
        </HStack>
      </Skeleton>
    </VStack>
  )

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
          <Text color="#38BF66" fontWeight={600}>
            {t("For")}
          </Text>
          <UilArrowUpRight size="20px" color="#004CFC" />
        </HStack>
      </Skeleton>
    </VStack>
  )
}
