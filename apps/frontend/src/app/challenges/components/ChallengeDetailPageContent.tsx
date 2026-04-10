"use client"

import {
  Badge,
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Icon,
  IconButton,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
  Wrap,
} from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import NextLink from "next/link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaAngleLeft } from "react-icons/fa6"
import { LuPlus } from "react-icons/lu"

import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeVisibility,
  SettlementMode,
  ThresholdMode,
} from "@/api/challenges/types"
import { useChallenge } from "@/api/challenges/useChallenge"
import { useChallengeParticipantActions } from "@/api/challenges/useChallengeParticipantActions"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { AddressIcon } from "@/components/AddressIcon"
import { AppImage } from "@/components/AppImage/AppImage"
import { MotionVStack } from "@/components/MotionVStack"

import { AddChallengeInvitesModal } from "./AddChallengeInvitesModal"
import { ChallengeActions, hasChallengeActions } from "./ChallengeActions"
import { ChallengeParticipantActionsSection } from "./ChallengeParticipantActionsSection"
import { ChallengeStatTile } from "./ChallengeStatTile"
import { ChallengeStatusBadge, ChallengeVisibilityBadge } from "./ChallengeStatusBadges"
import { SponsoredChallengeInfo } from "./SponsoredChallengeInfo"

export const ChallengeDetailPageContent = ({ challengeId }: { challengeId: string }) => {
  const { account } = useWallet()
  const viewerAddress = account?.address
  const { data: challenge, isLoading } = useChallenge(challengeId, viewerAddress)
  const { data: participantActions } = useChallengeParticipantActions(
    challenge?.challengeId ?? 0,
    challenge?.participants ?? [],
  )
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: appsData } = useXApps()
  const { t } = useTranslation()
  const appNames = useMemo(
    () => new Map((appsData?.allApps ?? []).map(app => [app.id.toLowerCase(), app.name])),
    [appsData?.allApps],
  )
  const currentRound = Number(currentRoundId ?? 0)

  if (isLoading) {
    return (
      <MotionVStack renderInnerStack={false} gap="6">
        <Card.Root variant="primary" p={{ base: "6", md: "8" }} w="full" borderRadius="3xl" boxShadow="sm">
          <Skeleton h="360px" borderRadius="2xl" />
        </Card.Root>
      </MotionVStack>
    )
  }

  if (!challenge) {
    return (
      <MotionVStack renderInnerStack={false} gap="6">
        <Card.Root variant="primary" p={{ base: "6", md: "8" }} w="full" borderRadius="3xl" boxShadow="sm">
          <VStack gap="3" py="8">
            <Heading size="md">{t("Challenge not found")}</Heading>
            <Button asChild variant="secondary" size="sm">
              <NextLink href="/challenges">{t("Back to challenges")}</NextLink>
            </Button>
          </VStack>
        </Card.Root>
      </MotionVStack>
    )
  }

  const createdAtLabel = challenge.createdAt > 0 ? dayjs.unix(challenge.createdAt).format("D MMM, YYYY") : null
  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const winnerTypeLabel = t(
    challenge.thresholdMode === ThresholdMode.SplitAboveThreshold ? "Split prize" : "Max actions",
  )
  const roundsProgress =
    currentRound > 0 && challenge.duration > 0
      ? `${Math.min(Math.max(currentRound - challenge.startRound + 1, 0), challenge.duration)} / ${challenge.duration}`
      : `${challenge.startRound}-${challenge.endRound}`
  const showParticipatingBadge =
    challenge.isJoined && challenge.status !== ChallengeStatus.Cancelled && challenge.status !== ChallengeStatus.Invalid
  const showSponsoringBadge = isSponsored && challenge.isCreator
  const showInviteStats = challenge.visibility === ChallengeVisibility.Private
  const splitPrizeWinnerCount =
    challenge.status !== ChallengeStatus.Finalized || challenge.settlementMode !== SettlementMode.QualifiedSplit
      ? 0
      : (participantActions?.leaderboard.filter(entry => entry.actions >= Number(challenge.threshold)).length ?? 0)
  const splitPrizePerWinnerLabel =
    splitPrizeWinnerCount > 0
      ? humanNumber(
          Number(challenge.totalPrize) / splitPrizeWinnerCount,
          Number(challenge.totalPrize) / splitPrizeWinnerCount,
          "B3TR",
        )
      : null
  const winnerValue =
    challenge.thresholdMode === ThresholdMode.SplitAboveThreshold && splitPrizePerWinnerLabel
      ? `${winnerTypeLabel} · ${splitPrizePerWinnerLabel}`
      : winnerTypeLabel
  const challengeTitle = challenge.title || t("Challenge #{{id}}", { id: challenge.challengeId })

  return (
    <MotionVStack renderInnerStack={false} gap="6">
      <VStack align="stretch" w="full" gap="5">
        {/* Back nav */}
        <Button asChild w="fit-content" variant="ghost" px="3">
          <NextLink href="/challenges">
            <Icon as={FaAngleLeft} boxSize={3} />
            <Text color="inherit" textStyle="sm" fontWeight="semibold">
              {t("Back to challenges")}
            </Text>
          </NextLink>
        </Button>

        {/* Hero card */}
        <Card.Root variant="primary" p={{ base: "6", md: "8" }} gap="6" borderRadius="3xl" boxShadow="sm">
          <VStack align="stretch" gap="6">
            {/* Top: badges + title + meta */}
            <Stack direction={{ base: "column", xl: "row" }} gap="6" align={{ base: "stretch", xl: "start" }}>
              <VStack align="stretch" gap="4" flex="1">
                <Wrap gap="2">
                  <ChallengeVisibilityBadge challenge={challenge} />
                  <ChallengeStatusBadge challenge={challenge} />
                  {showParticipatingBadge && (
                    <Badge variant="positive" size="sm">
                      {t("Participating")}
                    </Badge>
                  )}
                  {showSponsoringBadge && (
                    <Badge variant="warning" size="sm">
                      {t("Sponsoring")}
                    </Badge>
                  )}
                </Wrap>

                <Heading textStyle={{ base: "2xl", md: "4xl" }} lineHeight="1.02">
                  {challengeTitle}
                </Heading>

                <Wrap gap="2">
                  <HStack gap="1.5" bg="bg.secondary" borderRadius="full" px="2.5" py="1.5" align="center">
                    <AddressIcon address={challenge.creator} boxSize="4" borderRadius="full" />
                    <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                      {humanAddress(challenge.creator, 6, 4)}
                    </Text>
                  </HStack>
                  {createdAtLabel && (
                    <HStack bg="bg.secondary" borderRadius="full" px="2.5" py="1.5" align="center">
                      <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                        {t("Created")} {createdAtLabel}
                      </Text>
                    </HStack>
                  )}
                  <HStack bg="bg.secondary" borderRadius="full" px="2.5" py="1.5" align="center">
                    <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                      {t("Start round")} {humanNumber(challenge.startRound)}
                    </Text>
                  </HStack>
                  <HStack bg="bg.secondary" borderRadius="full" px="2.5" py="1.5" align="center">
                    <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                      {t("End round")} {humanNumber(challenge.endRound)}
                    </Text>
                  </HStack>
                </Wrap>
              </VStack>

              {/* CTA */}
              {hasChallengeActions(challenge) && (
                <Box
                  w={{ base: "full", xl: "sm" }}
                  flexShrink={0}
                  bg="bg.secondary"
                  borderRadius="2xl"
                  border="sm"
                  borderColor="border.secondary"
                  p="4">
                  <ChallengeActions challenge={challenge} layout="card" />
                </Box>
              )}
            </Stack>

            {/* Stats grid */}
            <SimpleGrid columns={{ base: 2, xl: 3 }} gap="3">
              <ChallengeStatTile
                label={t("Prize")}
                value={humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
                valueProps={{ color: "brand.primary", textStyle: { base: "xl", md: "2xl" } }}
              />
              {isSponsored ? (
                <ChallengeStatTile label={t("Type")}>
                  <Box pt="0.5">
                    <SponsoredChallengeInfo textProps={{ textStyle: { base: "md", md: "lg" }, fontWeight: "bold" }} />
                  </Box>
                </ChallengeStatTile>
              ) : (
                <ChallengeStatTile
                  label={t("Bet")}
                  value={humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")}
                  valueProps={{ textStyle: { base: "xl", md: "2xl" } }}
                />
              )}
              <ChallengeStatTile
                label={t("Winner")}
                value={winnerValue}
                valueProps={{ textStyle: { base: "lg", md: "xl" } }}
                helper={
                  challenge.threshold !== "0" ? (
                    <Text textStyle="xs" color="text.subtle">
                      {t("Minimum actions")} {humanNumber(challenge.threshold)}
                    </Text>
                  ) : undefined
                }
              />
              <ChallengeStatTile
                label={t("Participants")}
                action={
                  challenge.canAddInvites ? (
                    <AddChallengeInvitesModal
                      challengeId={challenge.challengeId}
                      creatorAddress={challenge.creator}
                      existingInvitees={challenge.invited}>
                      <IconButton
                        minW="9"
                        h="9"
                        p="0"
                        borderRadius="full"
                        bg="actions.primary.default"
                        color="actions.primary.text"
                        fontSize="lg"
                        lineHeight="1"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        _hover={{ bg: "actions.primary.hover" }}
                        _active={{ bg: "actions.primary.pressed" }}
                        aria-label={t("Add invitee")}>
                        <LuPlus />
                      </IconButton>
                    </AddChallengeInvitesModal>
                  ) : undefined
                }
                helper={
                  showInviteStats && (challenge.invited.length > 0 || challenge.declined.length > 0) ? (
                    <Wrap gap="1.5">
                      {challenge.invited.length > 0 && (
                        <Badge variant="neutral" size="sm">
                          {t("Invited")} {humanNumber(challenge.invited.length)}
                        </Badge>
                      )}
                      {challenge.declined.length > 0 && (
                        <Badge variant="neutral" size="sm">
                          {t("Declined")} {humanNumber(challenge.declined.length)}
                        </Badge>
                      )}
                    </Wrap>
                  ) : undefined
                }>
                <Text textStyle={{ base: "xl", md: "2xl" }} fontWeight="bold" lineHeight="1.1">
                  {humanNumber(challenge.participantCount)}
                  <Text as="span" color="text.subtle" fontWeight="semibold">
                    {" / "} {humanNumber(challenge.maxParticipants)}
                  </Text>
                </Text>
              </ChallengeStatTile>
              <ChallengeStatTile
                label={t("Rounds")}
                value={roundsProgress}
                valueProps={{ textStyle: { base: "xl", md: "2xl" } }}
                helper={
                  <Text textStyle="xs" color="text.subtle">
                    {t("End round")} {humanNumber(challenge.endRound)}
                  </Text>
                }
              />
              <ChallengeStatTile
                label={t("Apps")}
                value={challenge.allApps ? t("All apps") : humanNumber(challenge.selectedApps.length)}
                valueProps={{ textStyle: { base: "xl", md: "2xl" } }}
                helper={
                  !challenge.allApps ? (
                    <Text textStyle="xs" color="text.subtle">
                      {t("Selected apps")}
                    </Text>
                  ) : undefined
                }
              />
            </SimpleGrid>
          </VStack>
        </Card.Root>

        {/* Details: apps */}
        {!challenge.allApps && (
          <Card.Root variant="primary" p={{ base: "6", md: "7" }} gap="4" borderRadius="3xl" boxShadow="sm">
            <VStack align="stretch" gap="3">
              <HStack justify="space-between" align="center" gap="3">
                <Text
                  textStyle="xxs"
                  color="text.subtle"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  fontWeight="semibold">
                  {t("Selected apps")}
                </Text>
                <Badge variant="neutral" size="sm">
                  {humanNumber(challenge.selectedApps.length)}
                </Badge>
              </HStack>
              <Wrap gap="2">
                {challenge.selectedApps.map(app => (
                  <HStack
                    key={app}
                    gap="2.5"
                    w={{ base: "full", sm: "auto" }}
                    maxW={{ base: "full", sm: "xs" }}
                    minH="12"
                    px="4"
                    py="3"
                    borderRadius="xl"
                    bg="bg.secondary"
                    border="sm"
                    borderColor="border.secondary">
                    <AppImage appId={app} boxSize="7" borderRadius="md" flexShrink={0} />
                    <Text
                      textStyle="sm"
                      fontWeight="medium"
                      minW="0"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap">
                      {appNames.get(app.toLowerCase()) ?? humanAddress(app, 6, 4)}
                    </Text>
                  </HStack>
                ))}
              </Wrap>
            </VStack>
          </Card.Root>
        )}

        {/* Leaderboard / participant actions */}
        <ChallengeParticipantActionsSection challenge={challenge} />
      </VStack>
    </MotionVStack>
  )
}
