import { Button, Card, HStack, Icon, Stack, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { ReactNode, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCircleAlert } from "react-icons/lu"

import { useCanUserVote } from "../../../api/contracts/governance/hooks/useCanUserVote"
import { useVeDelegateAutoDeposit } from "../../../api/contracts/veDelegate/hooks/useVeDelegateAutoDeposit"
import { useAccountLinking } from "../../../api/contracts/vePassport/hooks/useAccountLinking"
import { useGetDelegatee } from "../../../api/contracts/vePassport/hooks/useGetDelegatee"
import { useUserDelegation } from "../../../api/contracts/vePassport/hooks/useUserDelegation"
import { useIsVeDelegated } from "../../../hooks/useIsVeDelegated"

/**
 * Warning card for non-journey "can't vote" reasons:
 * - delegator (account has delegated voting power away)
 * - secondary (account is linked as a secondary/non-primary)
 * - signaled (account flagged as suspicious)
 * - blacklisted
 *
 * Onboarding/journey states (new user, first-vote, active-voter) are owned by `OnboardingCard`.
 * veDelegate users are suppressed here too because `DelegatingBanner` already covers them.
 */
type CantVoteReason = "delegator" | "secondary" | "signaled" | "blacklisted"

type ReasonText = {
  title: string
  description: ReactNode
  onLearnMoreClick?: () => void
}

export const CantVoteCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()
  const { isEntity, isLoading: isLoadingAccountLinking } = useAccountLinking()
  const { isDelegator, isLoading: isLoadingDelegator } = useUserDelegation()
  const { isLoading: isDelegateeLoading } = useGetDelegatee(account?.address)
  const { isVeDelegated } = useIsVeDelegated(account?.address ?? "")
  const { hasAutoDeposit } = useVeDelegateAutoDeposit(account?.address)
  const { isLoading: canVoteLoading, isPerson, personReason } = useCanUserVote()

  const handleGoToLinking = useCallback(() => {
    router.push("/profile?tab=linked-accounts")
  }, [router])

  const handleGoToGovernance = useCallback(() => {
    router.push("/profile?tab=governance")
  }, [router])

  const isUsingVeDelegate = isVeDelegated || hasAutoDeposit

  const cantVoteReason = useMemo<CantVoteReason | null>(() => {
    if (!account?.address || isLoadingAccountLinking || isLoadingDelegator || canVoteLoading || isDelegateeLoading)
      return null
    if (isUsingVeDelegate) return null
    if (isEntity) return "secondary"
    if (isDelegator) return "delegator"
    if (!isPerson) {
      if (personReason.includes("signaled")) return "signaled"
      if (personReason.includes("blacklisted")) return "blacklisted"
    }
    return null
  }, [
    account?.address,
    isEntity,
    isLoadingAccountLinking,
    isLoadingDelegator,
    isDelegator,
    canVoteLoading,
    isDelegateeLoading,
    isUsingVeDelegate,
    isPerson,
    personReason,
  ])

  const reasonText = useMemo<ReasonText | null>(() => {
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
      default:
        return null
    }
  }, [cantVoteReason, t, handleGoToGovernance, handleGoToLinking])

  if (!reasonText) return null

  return (
    <Card.Root
      bg="status.warning.subtle"
      border="1px solid"
      borderColor="status.warning.primary"
      rounded="xl"
      w="full"
      h="full"
      p="4">
      <Card.Body position="relative" overflow="hidden" borderRadius="xl" p="0">
        <VStack gap={0} w="full" align="flex-start">
          <HStack align={["flex-start", "flex-start", "center"]} position="relative" w="full" h="full">
            <Icon asChild color="status.warning.strong" boxSize="9" flexShrink={0}>
              <LuCircleAlert />
            </Icon>
            <VStack gap={0} w="full" align="flex-start">
              <Text fontWeight="bold" color="status.warning.strong" as="span">
                {reasonText.title}
              </Text>
              <Stack
                flexDir={{ base: "column", md: "row" }}
                gap="0"
                alignSelf="flex-end"
                justify="space-between"
                alignItems={{ base: "flex-end", md: "flex-start" }}
                w="full">
                <Text as="div" color="status.warning.strong">
                  {reasonText.description}
                </Text>
                {!!reasonText.onLearnMoreClick && (
                  <Button
                    size="sm"
                    alignItems="flex-end"
                    variant="plain"
                    _hover={{ textDecoration: "underline" }}
                    color="status.warning.strong"
                    onClick={reasonText.onLearnMoreClick}>
                    {t("Learn more")}
                  </Button>
                )}
              </Stack>
            </VStack>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
