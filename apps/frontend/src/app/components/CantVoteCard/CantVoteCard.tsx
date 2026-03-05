import { VStack, Button, useDisclosure, Card, Text, Stack, HStack, List, Skeleton } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { ReactNode, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCircleCheck, LuCircleDashed } from "react-icons/lu"

import { DoActionModal } from "@/app/components/ActionBanners/components/DoActionBanner/components/DoActionModal"

import { useCanUserVote } from "../../../api/contracts/governance/hooks/useCanUserVote"
import { useAccountLinking } from "../../../api/contracts/vePassport/hooks/useAccountLinking"
import { useUserDelegation } from "../../../api/contracts/vePassport/hooks/useUserDelegation"
import { useUserScore } from "../../../api/indexer/sustainability/useUserScore"
import { useGetVot3Balance } from "../../../hooks/useGetVot3Balance"

type CantVoteReason = "no-votes" | "delegator" | "secondary" | "no-actions" | "signaled" | "blacklisted"
type CantVoteReasonText = {
  title: string
  description: ReactNode
  onLearnMoreClick?: () => void
}

/**
 * Uses isPerson from the contract (checked at snapshot) as source of truth for the actions check.
 * missingActions from the indexer is only used as guidance for how many more actions are needed.
 */
export const VotingRequirementsList = ({ isPerson }: { isPerson?: boolean }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { missingActions, isLoading: isLoadingMissingActions } = useUserScore()
  const { data: voteBalance, isLoading: isLoadingVoteBalance } = useGetVot3Balance(account?.address)

  // Contract isPerson (at snapshot) is the source of truth.
  // If isPerson is explicitly false, the user does NOT have enough actions regardless of indexer data.
  const hasEnoughActions = isPerson ?? missingActions <= 0

  return (
    <Skeleton loading={isLoadingMissingActions || isLoadingVoteBalance}>
      <List.Root variant="plain">
        <List.Item>
          <List.Indicator asChild color="inherit">
            {hasEnoughActions ? <LuCircleCheck /> : <LuCircleDashed />}
          </List.Indicator>
          {t("Complete {{count}} more Better Actions in our apps", { count: Math.max(missingActions, 1) })}
        </List.Item>
        <List.Item>
          <List.Indicator asChild color="inherit">
            {!!voteBalance?.original && Number(voteBalance.original) > 0 ? <LuCircleCheck /> : <LuCircleDashed />}
          </List.Indicator>
          {t("Convert your B3TR to VOT3 to gain voting power in the next round")}
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

  const { hasVotesAtSnapshot, isLoading: canVoteLoading, isPerson, personReason } = useCanUserVote()

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
    if (!isPerson) {
      if (personReason.includes("signaled")) return "signaled"
      if (personReason.includes("blacklisted")) return "blacklisted"
      return "no-actions"
    }
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
    personReason,
  ])

  const cantVoteReasonText = useMemo<CantVoteReasonText | null>(() => {
    switch (cantVoteReason) {
      case "delegator":
        return {
          title: t("You can't vote because this is a delegated account."),
          description: t("Go to your profile to learn more about delegated accounts."),
          onLearnMoreClick: handleGoToGovernance,
        }
      case "secondary":
        return {
          title: t("You can't vote because this is a secondary account."),
          description: t(
            "Switch to your main account to vote or go to your profile to learn more about linked accounts.",
          ),
          onLearnMoreClick: handleGoToLinking,
        }
      case "signaled":
        return {
          title: t("You can't vote because you've been signaled as suspicious."),
          description: t("If you believe this is unfair, reach out to the app that signaled you to resolve the issue."),
        }
      case "blacklisted":
        return {
          title: t("You can't vote because your account has been blacklisted."),
          description: t("Contact VeBetterDAO support for more information."),
        }
      case "no-votes":
      case "no-actions":
        return {
          title: t("You're not eligible to vote yet. To vote in next round:"),
          description: <VotingRequirementsList isPerson={isPerson} />,
          onLearnMoreClick: handleOpenDoActionModal,
        }

      default:
        return null
    }
  }, [cantVoteReason, t, isPerson, handleGoToGovernance, handleGoToLinking, handleOpenDoActionModal])

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
