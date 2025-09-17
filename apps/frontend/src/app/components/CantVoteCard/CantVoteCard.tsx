import { useAccountLinking, useCanUserVote, useUserDelegation, useUserScore } from "@/api"
import { useGetVot3Balance } from "@/hooks"
import { VStack, Button, useDisclosure, Card, Text, Stack, HStack, List, Skeleton } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { DoActionModal } from "@/app/components/ActionBanners/components/DoActionBanner/components/DoActionModal"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { ReactNode, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCircleCheck, LuCircleDashed } from "react-icons/lu"

type CantVoteReason = "no-votes" | "delegator" | "secondary" | "no-actions"

type CantVoteReasonText = {
  title: string
  description: ReactNode
  onLearnMoreClick?: () => void
}

export const VotingRequirementsList = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { missingActions, isLoading: isLoadingMissingActions } = useUserScore()
  const { data: voteBalance, isLoading: isLoadingVoteBalance } = useGetVot3Balance(account?.address)

  return (
    <Skeleton loading={isLoadingMissingActions || isLoadingVoteBalance}>
      <List.Root variant="plain">
        <List.Item>
          <List.Indicator asChild color="inherit">
            {missingActions <= 0 ? <LuCircleCheck /> : <LuCircleDashed />}
          </List.Indicator>

          {t("Complete at least 3 sustainable actions")}
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="inherit">
            {!!voteBalance?.original && Number(voteBalance.original) > 0 ? <LuCircleCheck /> : <LuCircleDashed />}
          </List.Indicator>

          {t("Swap your B3TR for VOT3 this round before the snapshot")}
        </List.Item>
      </List.Root>
    </Skeleton>
  )
}

export const CantVoteCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()
  const { isEntity, isLoading: isLoadingAccountLinking } = useAccountLinking()
  const { isDelegator, isLoading: isLoadingDelegator } = useUserDelegation()
  const doActionModal = useDisclosure()

  const { hasVotesAtSnapshot, isLoading: canVoteLoading, isPerson } = useCanUserVote()

  const handleGoToLinking = useCallback(() => {
    router.push("/profile?tab=linked-accounts")
  }, [router])

  const handleGoToGovernance = useCallback(() => {
    router.push("/profile?tab=governance")
  }, [router])

  const handleOpenDoActionModal = useCallback(() => {
    doActionModal.onOpen()
  }, [doActionModal])

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
      case "no-actions":
        return {
          title: t("You're not eligible to vote yet. To vote in next round:"),
          description: <VotingRequirementsList />,
          onLearnMoreClick: handleOpenDoActionModal,
        }

      default:
        return null
    }
  }, [cantVoteReason, t, handleGoToGovernance, handleGoToLinking, handleOpenDoActionModal])

  if (!cantVoteReasonText) return null

  return (
    <Card.Root bg="#FFF3E5" border="1px solid #AF5F00" rounded="xl" w="full" h={"full"}>
      <Card.Body position="relative" overflow="hidden" borderRadius="xl" padding="4">
        <VStack gap={0} w="full" align="flex-start">
          <HStack align={["flex-start", "flex-start", "center"]} position="relative" w="full" h="full">
            <UilInfoCircle size={36} color="#AF5F00" />
            <VStack gap={2} w="full" align="flex-start">
              <Text fontWeight="700" color="#AF5F00" as="span">
                {cantVoteReasonText?.title}
              </Text>
              <Stack
                flexDir={{ base: "column", md: "row" }}
                gap="0"
                alignSelf="flex-end"
                justify="space-between"
                alignItems={{ base: "flex-end", md: "flex-start" }}
                w="full">
                <Text color="#AF5F00">{cantVoteReasonText?.description}</Text>

                {!!cantVoteReasonText?.onLearnMoreClick && (
                  <Button
                    size="sm"
                    alignItems="flex-end"
                    variant="plain"
                    _hover={{ textDecoration: "underline" }}
                    color="#AF5F00"
                    onClick={cantVoteReasonText.onLearnMoreClick}>
                    {t("Learn more")}
                  </Button>
                )}
              </Stack>
            </VStack>
          </HStack>
        </VStack>
      </Card.Body>

      <DoActionModal doActionModal={doActionModal} />
    </Card.Root>
  )
}
