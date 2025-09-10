import { useAccountLinking, useCanUserVote, useUserDelegation } from "@/api"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { Card, HStack, Text, VStack, Button } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

type CantVoteReason = "no-votes" | "delegator" | "secondary" | "no-actions"

type CantVoteReasonText = {
  title: string
  description: string
  onLearnMoreClick?: () => void
}
export const CantVoteCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()
  const { isEntity, isLoading: isLoadingAccountLinking } = useAccountLinking()
  const { isDelegator, isLoading: isLoadingDelegator } = useUserDelegation()

  const { hasVotesAtSnapshot, snapshotBlock, isLoading: canVoteLoading, isPerson } = useCanUserVote()
  const snapshotTimestamp = useEstimateBlockTimestamp({ blockNumber: snapshotBlock })

  const snapshotDateText = useMemo(() => {
    if (!snapshotTimestamp) return ""

    const date = dayjs(snapshotTimestamp).format("MMM D [at] h:mm A")

    return `(${date})`
  }, [snapshotTimestamp])

  const handleGoToLinking = useCallback(() => {
    router.push("/profile?tab=linked-accounts")
  }, [router])

  const handleGoToGovernance = useCallback(() => {
    router.push("/profile?tab=governance")
  }, [router])

  const cantVoteReason = useMemo<CantVoteReason | null>(() => {
    if (!account?.address || isLoadingAccountLinking || isLoadingDelegator || canVoteLoading) return null
    if (isEntity) return "secondary"
    if (isDelegator) return "delegator"
    if (!hasVotesAtSnapshot) return "no-votes"
    if (!isPerson) return "no-actions"
    return null
  }, [
    account?.address,
    isEntity,
    isLoadingAccountLinking,
    isLoadingDelegator,
    isDelegator,
    canVoteLoading,
    hasVotesAtSnapshot,
    isPerson,
  ])

  const cantVoteReasonText = useMemo<CantVoteReasonText | null>(() => {
    switch (cantVoteReason) {
      case "delegator":
        return {
          title: t("You can’t vote because this is a delegated account."),
          description: t("Go to your profile to learn more about delegated accounts."),
          onLearnMoreClick: handleGoToGovernance,
        }
      case "secondary":
        return {
          title: t("You can’t vote because this is a secondary account."),
          description: t(
            "Switch to your main account to vote or go to your profile to learn more about linked accounts.",
          ),
          onLearnMoreClick: handleGoToLinking,
        }
      case "no-votes":
        return {
          title: t("You can’t vote because you have no voting power."),
          description: t(
            "A snapshot was taken when the round started {{snapshotDate}}. To vote, complete sustainable actions and swap your B3TR for VOT3.",
            {
              snapshotDate: snapshotDateText,
            },
          ),
        }

      case "no-actions":
        return {
          title: t("You can't vote because you haven't accumulated enough actions."),
          description: t("You can earn actions by using the dApps."),
        }
      default:
        return null
    }
  }, [cantVoteReason, t, handleGoToGovernance, handleGoToLinking, snapshotDateText])

  if (!cantVoteReasonText) return null

  return (
    <Card.Root bg="#FFF3E5" border="1px solid #AF5F00" rounded="xl" w="full" h={"full"} p="4">
      <Card.Body position="relative" overflow="hidden" borderRadius="xl" p="0">
        <VStack gap={0} w="full" align="flex-start">
          <HStack align={["flex-start", "flex-start", "center"]} position="relative" w="full" h="full">
            <UilInfoCircle size={36} color="#AF5F00" />
            <VStack gap={0} w="full" align="flex-start">
              <Text fontWeight="bold" color="#AF5F00" as="span">
                {cantVoteReasonText?.title}
              </Text>
              <Text color="#AF5F00" as="span">
                {" "}
                {cantVoteReasonText?.description}{" "}
              </Text>
            </VStack>
          </HStack>
          {!!cantVoteReasonText?.onLearnMoreClick && (
            <Button
              variant="plain"
              alignSelf={"flex-end"}
              textDecoration="underline"
              color="#AF5F00"
              onClick={cantVoteReasonText.onLearnMoreClick}>
              {t("Learn more")}
            </Button>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
