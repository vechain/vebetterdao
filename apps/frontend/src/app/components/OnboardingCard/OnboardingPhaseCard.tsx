import { Box, Button, Card, Heading, Icon, Image, Stack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { IoGridOutline } from "react-icons/io5"
import { LuCircleAlert, LuSparkles, LuZap } from "react-icons/lu"

import { DoActionModal } from "@/app/components/ActionBanners/components/DoActionBanner/components/DoActionModal"
import { PowerUpModal } from "@/components/PowerUpModal"

import { useCanUserVote } from "../../../api/contracts/governance/hooks/useCanUserVote"
import { useUserScore } from "../../../api/indexer/sustainability/useUserScore"
import { useGetB3trBalance } from "../../../hooks/useGetB3trBalance"
import { useGetVot3Balance } from "../../../hooks/useGetVot3Balance"
import { useUserOnboardingPhase } from "../../../hooks/useUserOnboardingPhase"

import { VotingRequirementsList } from "./VotingRequirementsList"

/**
 * Phase 1 of the voter journey — for users who have never voted and aren't eligible yet.
 *
 * Sub-variants:
 * - "new" (sub-threshold VOT3 at snapshot, encouraging green) — frame as "prepare for next round"
 * - "returning" (has VOT3 at snapshot but missing actions, warning amber) — frame as "you can still vote this round"
 *
 * Gating: `phase === "onboarding"` from useUserOnboardingPhase. The hook owns the
 * "has voted before" (Galaxy Member NFT) check, so users who lost their VOT3 but have
 * already voted in past rounds do NOT see this card — they belong in ActiveVoterCard.
 */
export const OnboardingPhaseCard = () => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const router = useRouter()
  const doActionModal = useDisclosure()
  const powerUpModal = useDisclosure()

  const { phase } = useUserOnboardingPhase()
  const { hasVotesAtSnapshot, isPerson } = useCanUserVote()
  const { missingActions } = useUserScore()
  const { data: b3trBalance } = useGetB3trBalance(account?.address)
  const { data: voteBalance } = useGetVot3Balance(account?.address)

  const handleGoToApps = useCallback(() => {
    router.push("/apps")
  }, [router])

  const handleOpenDoActionModal = useCallback(() => {
    doActionModal.onOpen()
  }, [doActionModal])

  const hasEnoughActions = isPerson ?? missingActions <= 0
  const hasB3trToConvert = Number(b3trBalance?.scaled ?? "0") >= 1
  const holdsAtLeastOneVot3 = Number(voteBalance?.scaled ?? "0") >= 1
  const allStepsComplete = hasEnoughActions && holdsAtLeastOneVot3

  const primaryAction = allStepsComplete
    ? null
    : !hasEnoughActions
      ? { label: t("Explore apps"), onClick: handleGoToApps, icon: <IoGridOutline /> }
      : hasB3trToConvert && !holdsAtLeastOneVot3
        ? { label: t("Power up"), onClick: powerUpModal.onOpen, icon: <LuZap /> }
        : { label: t("Explore apps"), onClick: handleGoToApps, icon: <IoGridOutline /> }

  if (phase !== "onboarding") return null

  // Within the onboarding phase, sub-variant: "new" if sub-threshold VOT3, "returning" otherwise.
  const isNew = !hasVotesAtSnapshot

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
          <Icon asChild color={palette.strong} boxSize="9" flexShrink={0} display={{ base: "none", md: "inline-flex" }}>
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
            boxSize={{ base: "200px", md: "200px" }}
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
