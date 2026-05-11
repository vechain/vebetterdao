import { VStack, Button, useDisclosure, Card, Text, Stack, HStack, Icon, Image, Heading, Box } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { ReactNode, useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"
import { LuCircleAlert, LuSparkles, LuZap } from "react-icons/lu"

import { DoActionModal } from "@/app/components/ActionBanners/components/DoActionBanner/components/DoActionModal"
import { PowerUpModal } from "@/components/PowerUpModal"

import { useCanUserVote } from "../../../api/contracts/governance/hooks/useCanUserVote"
import { useVeDelegateAutoDeposit } from "../../../api/contracts/veDelegate/hooks/useVeDelegateAutoDeposit"
import { useAccountLinking } from "../../../api/contracts/vePassport/hooks/useAccountLinking"
import { useGetDelegatee } from "../../../api/contracts/vePassport/hooks/useGetDelegatee"
import { useUserDelegation } from "../../../api/contracts/vePassport/hooks/useUserDelegation"
import { useCurrentAllocationsRoundId } from "../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useHasVotedInRound } from "../../../api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useUserScore } from "../../../api/indexer/sustainability/useUserScore"
import { useGetB3trBalance } from "../../../hooks/useGetB3trBalance"
import { useGetVot3Balance } from "../../../hooks/useGetVot3Balance"
import { useIsVeDelegated } from "../../../hooks/useIsVeDelegated"

import { VotingRequirementsList } from "./VotingRequirementsList"

type CantVoteReason = "new" | "returning" | "delegator" | "secondary" | "signaled" | "blacklisted"

type SimpleReasonText = {
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
  const { missingActions } = useUserScore()
  const { data: b3trBalance } = useGetB3trBalance(account?.address)
  const { data: voteBalance } = useGetVot3Balance(account?.address)
  const doActionModal = useDisclosure()
  const powerUpModal = useDisclosure()

  const { hasVotesAtSnapshot, isLoading: canVoteLoading, isPerson, personReason } = useCanUserVote()
  const { data: currentRoundIdRaw } = useCurrentAllocationsRoundId()
  const { data: hasVotedAllocation } = useHasVotedInRound(currentRoundIdRaw ?? "0", account?.address)

  const handleGoToLinking = useCallback(() => {
    router.push("/profile?tab=linked-accounts")
  }, [router])

  const handleGoToGovernance = useCallback(() => {
    router.push("/profile?tab=governance")
  }, [router])

  const handleGoToApps = useCallback(() => {
    router.push("/apps")
  }, [router])

  const handleOpenDoActionModal = useCallback(() => {
    doActionModal.onOpen()
  }, [doActionModal])

  const isUsingVeDelegate = isVeDelegated || hasAutoDeposit
  const hasEnoughActions = isPerson ?? missingActions <= 0
  const hasB3trToConvert = Number(b3trBalance?.scaled ?? "0") >= 1
  const holdsAtLeastOneVot3 = Number(voteBalance?.scaled ?? "0") >= 1
  const allStepsComplete = hasEnoughActions && holdsAtLeastOneVot3

  // Contextual primary action: pick the most pressing next step for the user.
  // Order: missing actions → power up B3TR → fallback "earn more".
  // When all 3 steps are complete, no primary action is shown — the user is prepped for the next round.
  const primaryAction = allStepsComplete
    ? null
    : !hasEnoughActions
      ? { label: t("Explore apps"), onClick: handleGoToApps, icon: <IoGridOutline /> }
      : hasB3trToConvert && !holdsAtLeastOneVot3
        ? { label: t("Power up"), onClick: powerUpModal.onOpen, icon: <LuZap /> }
        : { label: t("Explore apps"), onClick: handleGoToApps, icon: <IoGridOutline /> }

  const cantVoteReason = useMemo<CantVoteReason | null>(() => {
    if (!account?.address || isLoadingAccountLinking || isLoadingDelegator || canVoteLoading || isDelegateeLoading)
      return null
    // veDelegate users see the DelegatingBanner via ActionBanner; suppress here to avoid duplication.
    if (isUsingVeDelegate) return null
    if (isEntity) return "secondary"
    if (isDelegator) return "delegator"
    if (!isPerson) {
      if (personReason.includes("signaled")) return "signaled"
      if (personReason.includes("blacklisted")) return "blacklisted"
      // Had ≥ threshold VOT3 at snapshot but missing actions → can still vote this round if they complete actions in time.
      if (hasVotesAtSnapshot) return "returning"
    }
    // User already voted this round (e.g. via a Navigator delegation) → don't show the "next round" framing.
    // FirstVoteCard owns the post-vote roadmap surface.
    if (hasVotedAllocation) return null
    // Sub-threshold VOT3 at snapshot → cannot vote this round regardless; prepare for next round.
    if (!hasVotesAtSnapshot) return "new"
    return null
  }, [
    account?.address,
    isEntity,
    hasVotedAllocation,
    isLoadingAccountLinking,
    isLoadingDelegator,
    isDelegator,
    canVoteLoading,
    isDelegateeLoading,
    isUsingVeDelegate,
    hasVotesAtSnapshot,
    isPerson,
    personReason,
  ])

  const simpleReasonText = useMemo<SimpleReasonText | null>(() => {
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

  if (!cantVoteReason) return null

  if (cantVoteReason === "new" || cantVoteReason === "returning") {
    const isNew = cantVoteReason === "new"
    const palette = isNew
      ? {
          bg: "status.positive.subtle",
          border: "status.positive.primary",
          strong: "status.positive.strong",
        }
      : {
          bg: "status.warning.subtle",
          border: "status.warning.primary",
          strong: "status.warning.strong",
        }
    const title = isNew ? t("You're almost there — get ready to vote next round") : t("You can still vote this round")
    const body = isNew
      ? t("Complete a few quick steps now and you'll qualify to vote in the next round.")
      : t("You have voting power but need to complete a few Better Actions before the round ends to unlock voting.")
    const mascotSrc = isNew ? "/assets/mascot/B3MO_Tokens_2.webp" : "/assets/mascot/mascot-warning-head.webp"

    return (
      <Card.Root
        bg={palette.bg}
        border="1px solid"
        borderColor={palette.border}
        rounded="xl"
        w="full"
        h="full"
        p="4"
        position="relative"
        overflow="hidden">
        <Card.Body position="relative" p="0">
          <Stack direction={{ base: "column", md: "row" }} align="flex-start" gap="4">
            <Icon
              asChild
              color={palette.strong}
              boxSize="9"
              flexShrink={0}
              display={{ base: "none", md: "inline-flex" }}>
              {isNew ? <LuSparkles /> : <LuCircleAlert />}
            </Icon>
            <VStack align="flex-start" gap="3" flex="1" minW={0} w="full">
              <VStack align="flex-start" gap="1">
                <Heading size="md" fontWeight="bold" color={palette.strong}>
                  {title}
                </Heading>
                <Text color={palette.strong}>{body}</Text>
              </VStack>
              <Box color={palette.strong} w="full">
                <VotingRequirementsList isPerson={isPerson} />
              </Box>
              <Stack
                direction={{ base: "column", sm: "row" }}
                gap="2"
                mt="4"
                w="full"
                align={{ base: "stretch", sm: "center" }}>
                {primaryAction && (
                  <Button size="sm" variant="tertiary" onClick={primaryAction.onClick}>
                    {primaryAction.icon}
                    {primaryAction.label}
                  </Button>
                )}
                <Button size="sm" variant="link" color={palette.strong} onClick={handleOpenDoActionModal}>
                  {t("Learn more")}
                </Button>
              </Stack>
            </VStack>
            <Image
              src={mascotSrc}
              alt="B3MO"
              boxSize={isNew ? { base: "200px", md: "200px" } : { base: "120px", md: "160px" }}
              objectFit="contain"
              flexShrink={0}
              display={{ base: "none", sm: "block" }}
            />
          </Stack>
        </Card.Body>
        <DoActionModal doActionModal={doActionModal} variant={isNew ? "new" : "returning"} />
        <PowerUpModal isOpen={powerUpModal.open} onClose={powerUpModal.onClose} />
      </Card.Root>
    )
  }

  if (!simpleReasonText) return null

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
                {simpleReasonText.title}
              </Text>
              <Stack
                flexDir={{ base: "column", md: "row" }}
                gap="0"
                alignSelf="flex-end"
                justify="space-between"
                alignItems={{ base: "flex-end", md: "flex-start" }}
                w="full">
                <Text as="div" color="status.warning.strong">
                  {simpleReasonText.description}
                </Text>

                {!!simpleReasonText.onLearnMoreClick && (
                  <Button
                    size="sm"
                    alignItems="flex-end"
                    variant="plain"
                    _hover={{ textDecoration: "underline" }}
                    color="status.warning.strong"
                    onClick={simpleReasonText.onLearnMoreClick}>
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
