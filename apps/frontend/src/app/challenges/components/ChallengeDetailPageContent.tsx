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

import { ChallengeKind, ChallengeStatus, SettlementMode, ThresholdMode } from "@/api/challenges/types"
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
import { ChallengeStatusBadge, ChallengeVisibilityBadge } from "./ChallengeStatusBadges"
import { SponsoredChallengeInfo } from "./SponsoredChallengeInfo"

const StatItem = ({ label, value, color }: { label: string; value: string | number; color?: string }) => {
  return (
    <VStack align="start" gap="1">
      <Text textStyle="xxs" color="text.subtle" textTransform="uppercase" letterSpacing="0.08em" fontWeight="semibold">
        {label}
      </Text>
      <Text textStyle="xl" fontWeight="bold" color={color}>
        {typeof value === "number" ? humanNumber(value) : value}
      </Text>
    </VStack>
  )
}

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
            <VStack align="stretch" gap="4">
              <HStack justify="space-between" align="center">
                <HStack gap="3" align="center">
                  <ChallengeVisibilityBadge challenge={challenge} />
                  <Heading size={{ base: "xl", md: "2xl" }}>
                    {t("Challenge #{{id}}", { id: challenge.challengeId })}
                  </Heading>
                </HStack>
                <ChallengeStatusBadge challenge={challenge} />
              </HStack>

              <VStack align="stretch" gap="2">
                <HStack flexWrap="wrap" gap="2" align="center">
                  <HStack gap="1.5" bg="bg.secondary" borderRadius="full" px="2.5" py="1" align="center">
                    <AddressIcon address={challenge.creator} boxSize="4" borderRadius="full" />
                    <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                      {humanAddress(challenge.creator, 6, 4)}
                    </Text>
                  </HStack>
                  {createdAtLabel && (
                    <Text color="text.subtle" textStyle="sm">
                      {"•"} {createdAtLabel}
                    </Text>
                  )}
                  <Text color="text.subtle" textStyle="sm">
                    {"•"} {t("Start round")} {humanNumber(challenge.startRound)}
                  </Text>
                  {(showParticipatingBadge || showSponsoringBadge) && (
                    <HStack flexWrap="wrap" gap="2">
                      {showParticipatingBadge && (
                        <HStack
                          gap="1.5"
                          bg="status.positive.subtle"
                          color="status.positive.strong"
                          borderRadius="full"
                          px="2.5"
                          py="1">
                          <Box boxSize="1.5" borderRadius="full" bg="status.positive.strong" />
                          <Text textStyle="xs" fontWeight="semibold">
                            {t("Participating")}
                          </Text>
                        </HStack>
                      )}
                      {showSponsoringBadge && (
                        <HStack
                          gap="1.5"
                          bg="status.warning.subtle"
                          color="status.warning.strong"
                          borderRadius="full"
                          px="2.5"
                          py="1">
                          <Box boxSize="1.5" borderRadius="full" bg="status.warning.primary" />
                          <Text textStyle="xs" fontWeight="semibold">
                            {t("Sponsoring")}
                          </Text>
                        </HStack>
                      )}
                    </HStack>
                  )}
                </HStack>
              </VStack>
            </VStack>

            {/* Stats grid */}
            <Box bg="bg.secondary" borderRadius="2xl" px={{ base: "4", md: "6" }} py={{ base: "4", md: "5" }}>
              <SimpleGrid columns={{ base: 2, md: 3 }} gapX={{ base: "4", md: "8" }} gapY="4">
                <StatItem
                  label={t("Prize")}
                  value={humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
                  color="brand.primary"
                />
                {isSponsored ? (
                  <VStack align="start" gap="1" gridColumn={{ base: "span 2", md: "auto" }}>
                    <Text
                      textStyle="xxs"
                      color="text.subtle"
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                      fontWeight="semibold">
                      {t("Type")}
                    </Text>
                    <SponsoredChallengeInfo textProps={{ textStyle: "md", fontWeight: "bold" }} />
                  </VStack>
                ) : (
                  <StatItem
                    label={t("Stake")}
                    value={humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")}
                  />
                )}
                <VStack align="start" gap="1" position="relative" pe={challenge.canAddInvites ? "14" : undefined}>
                  <Text
                    textStyle="xxs"
                    color="text.subtle"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    fontWeight="semibold">
                    {t("Participants")}
                  </Text>
                  {challenge.canAddInvites && (
                    <AddChallengeInvitesModal
                      challengeId={challenge.challengeId}
                      creatorAddress={challenge.creator}
                      existingInvitees={challenge.invited}>
                      <IconButton
                        position="absolute"
                        top="50%"
                        right="0"
                        transform="translateY(-50%)"
                        minW="8"
                        h="8"
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
                  )}
                  <Text textStyle="xl" fontWeight="bold">
                    {humanNumber(challenge.participantCount)} {" / "} {humanNumber(challenge.maxParticipants)}
                  </Text>
                </VStack>
                <StatItem label={t("Rounds")} value={roundsProgress} />
                {isSponsored && <StatItem label={t("Winner")} value={winnerValue} />}
                {challenge.threshold !== "0" && (
                  <StatItem label={t("Minimum actions")} value={humanNumber(challenge.threshold)} />
                )}
                <StatItem
                  label={t("Apps")}
                  value={challenge.allApps ? t("All apps") : String(challenge.selectedApps.length)}
                />
              </SimpleGrid>
            </Box>

            {/* CTA */}
            {hasChallengeActions(challenge) && (
              <Box pt="2" maxW={{ md: "sm" }}>
                <ChallengeActions challenge={challenge} layout="card" />
              </Box>
            )}
          </VStack>
        </Card.Root>

        {/* Details: apps + invited */}
        {(!challenge.allApps || challenge.invited.length > 0) && (
          <SimpleGrid columns={{ base: 1, lg: !challenge.allApps && challenge.invited.length > 0 ? 2 : 1 }} gap="4">
            {!challenge.allApps && (
              <Card.Root variant="primary" p={{ base: "6", md: "7" }} gap="4" borderRadius="3xl" boxShadow="sm">
                <VStack align="stretch" gap="3">
                  <Text
                    textStyle="xxs"
                    color="text.subtle"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    fontWeight="semibold">
                    {t("Selected apps")}
                  </Text>
                  <Wrap gap="2">
                    {challenge.selectedApps.map(app => (
                      <HStack
                        key={app}
                        gap="2.5"
                        w={{ base: "full", sm: "auto" }}
                        maxW={{ base: "full", sm: "xs" }}
                        minH="11"
                        px="3.5"
                        py="2.5"
                        borderRadius="2xl"
                        bg="bg.secondary"
                        border="1px solid"
                        borderColor="border.secondary">
                        <AppImage appId={app} boxSize="6" borderRadius="md" flexShrink={0} />
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

            {challenge.invited.length > 0 && (
              <Card.Root variant="primary" p={{ base: "6", md: "7" }} gap="4" borderRadius="3xl" boxShadow="sm">
                <VStack align="stretch" gap="3">
                  <Text
                    textStyle="xxs"
                    color="text.subtle"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    fontWeight="semibold">
                    {t("Invited wallets")}
                  </Text>
                  <HStack flexWrap="wrap" gap="2">
                    {challenge.invited.map(address => (
                      <Badge key={address} variant="neutral" size="sm">
                        {humanAddress(address, 6, 4)}
                      </Badge>
                    ))}
                  </HStack>
                </VStack>
              </Card.Root>
            )}
          </SimpleGrid>
        )}

        {/* Leaderboard / participant actions */}
        <ChallengeParticipantActionsSection challenge={challenge} />
      </VStack>
    </MotionVStack>
  )
}
