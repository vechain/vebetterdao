"use client"

import {
  Badge,
  Box,
  Card,
  Heading,
  HStack,
  IconButton,
  LinkBox,
  LinkOverlay,
  SimpleGrid,
  Text,
  VStack,
  Wrap,
} from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { LuPlus } from "react-icons/lu"

import {
  ChallengeDetail,
  ChallengeKind,
  ChallengeStatus,
  ChallengeView,
  ChallengeVisibility,
  ThresholdMode,
} from "@/api/challenges/types"
import { useChallenge } from "@/api/challenges/useChallenge"
import { AddressIcon } from "@/components/AddressIcon"
import { OverlappedAppsImages } from "@/components/OverlappedAppsImages"

import { AddChallengeInvitesModal } from "./AddChallengeInvitesModal"
import { ChallengeActions, hasChallengeActions } from "./ChallengeActions"
import { ChallengeStatTile } from "./ChallengeStatTile"
import { ChallengeStatusBadge, ChallengeVisibilityBadge } from "./ChallengeStatusBadges"
import { SponsoredChallengeInfo } from "./SponsoredChallengeInfo"

export const ChallengeCard = ({ challenge, currentRound }: { challenge: ChallengeView; currentRound: number }) => {
  const { t } = useTranslation()
  const createdAtLabel = challenge.createdAt > 0 ? dayjs.unix(challenge.createdAt).format("D MMM, YYYY") : null
  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const winnerTypeLabel = t(
    challenge.thresholdMode === ThresholdMode.SplitAboveThreshold ? "Split prize" : "Max actions",
  )
  const shouldLoadSelectedApps = !challenge.allApps && challenge.selectedAppsCount > 0
  const { data: challengeDetail, isLoading: isSelectedAppsLoading } = useChallenge(
    shouldLoadSelectedApps ? String(challenge.challengeId) : "",
  )
  const roundsProgress =
    currentRound > 0 && challenge.duration > 0
      ? `${Math.min(Math.max(currentRound - challenge.startRound + 1, 0), challenge.duration)} / ${challenge.duration}`
      : `${challenge.startRound}-${challenge.endRound}`
  const showParticipatingBadge =
    challenge.isJoined && challenge.status !== ChallengeStatus.Cancelled && challenge.status !== ChallengeStatus.Invalid
  const showSponsoringBadge = isSponsored && challenge.isCreator
  const showInviteStats = challenge.visibility === ChallengeVisibility.Private
  const challengeTitle = challenge.title || t("Challenge #{{id}}", { id: challenge.challengeId })
  const appsHelper = challenge.allApps ? null : isSelectedAppsLoading ? (
    <Box pt="1">
      <OverlappedAppsImages appsIds={[]} isLoading maxAppsToShow={4} iconSize={26} />
    </Box>
  ) : challengeDetail?.selectedApps.length ? (
    <Box pt="1">
      <OverlappedAppsImages appsIds={challengeDetail.selectedApps} maxAppsToShow={4} iconSize={26} />
    </Box>
  ) : (
    <Text textStyle="xs" color="text.subtle">
      {t("Selected apps")}
    </Text>
  )
  const participantHelper =
    showInviteStats && (challenge.invitedCount > 0 || challenge.declinedCount > 0) ? (
      <Wrap gap="1.5">
        {challenge.invitedCount > 0 && (
          <Badge variant="neutral" size="sm">
            {t("Invited")} {humanNumber(challenge.invitedCount)}
          </Badge>
        )}
        {challenge.declinedCount > 0 && (
          <Badge variant="neutral" size="sm">
            {t("Declined")} {humanNumber(challenge.declinedCount)}
          </Badge>
        )}
      </Wrap>
    ) : undefined

  return (
    <LinkBox h="full">
      <Card.Root
        variant="primary"
        p={{ base: "6", md: "7" }}
        gap="5"
        h="full"
        borderRadius="3xl"
        boxShadow="sm"
        position="relative"
        overflow="hidden"
        transform="translateY(0)"
        _hover={{ borderColor: "border.active", boxShadow: "lg", transform: "translateY(-2px)" }}>
        <VStack align="stretch" gap="6" h="full" position="relative">
          <VStack align="stretch" gap="4">
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

            <Heading
              textStyle={{ base: "xl", md: "2xl" }}
              lineHeight="1.05"
              wordBreak="break-word"
              overflowWrap="anywhere">
              <LinkOverlay asChild>
                <NextLink href={`/challenges/${challenge.challengeId}`}>{challengeTitle}</NextLink>
              </LinkOverlay>
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

          <SimpleGrid columns={2} gap="3">
            <ChallengeStatTile
              label={t("Prize")}
              value={humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
              valueProps={{ color: "brand.primary" }}
            />
            {isSponsored ? (
              <ChallengeStatTile label={t("Type")}>
                <Box pt="0.5">
                  <SponsoredChallengeInfo textProps={{ textStyle: { base: "sm", md: "md" }, fontWeight: "bold" }} />
                </Box>
              </ChallengeStatTile>
            ) : (
              <ChallengeStatTile
                label={t("Bet")}
                value={humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")}
              />
            )}
            <ChallengeStatTile
              label={t("Winner")}
              value={winnerTypeLabel}
              helper={
                challenge.threshold !== "0" ? (
                  <Text textStyle="xs" color="text.subtle">
                    {t("Minimum actions")} {humanNumber(challenge.threshold)}
                  </Text>
                ) : undefined
              }
            />
            <ChallengeStatTile
              label={t("Apps")}
              value={challenge.allApps ? t("All apps") : humanNumber(challenge.selectedAppsCount)}
              helper={appsHelper}
            />
            <ChallengeStatTile
              label={t("Participants")}
              action={
                challenge.canAddInvites ? (
                  <AddChallengeInvitesModal
                    challengeId={challenge.challengeId}
                    creatorAddress={challenge.creator}
                    existingInvitees={"invited" in challenge ? (challenge as ChallengeDetail).invited : undefined}>
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
              helper={participantHelper}>
              <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold" lineHeight="1.1">
                {humanNumber(challenge.participantCount)}
                <Text as="span" color="text.subtle" fontWeight="semibold">
                  {" / "} {humanNumber(challenge.maxParticipants)}
                </Text>
              </Text>
            </ChallengeStatTile>
            <ChallengeStatTile
              label={t("Rounds")}
              value={roundsProgress}
              helper={
                <Text textStyle="xs" color="text.subtle">
                  {t("End round")} {humanNumber(challenge.endRound)}
                </Text>
              }
            />
          </SimpleGrid>

          {hasChallengeActions(challenge) && (
            <Box mt="auto" bg="bg.secondary" borderRadius="2xl" border="sm" borderColor="border.secondary" p="3.5">
              <ChallengeActions challenge={challenge} layout="card" />
            </Box>
          )}
        </VStack>
      </Card.Root>
    </LinkBox>
  )
}
