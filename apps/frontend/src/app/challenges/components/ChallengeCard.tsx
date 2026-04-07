"use client"

import {
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
} from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { LuPlus } from "react-icons/lu"

import { ChallengeDetail, ChallengeKind, ChallengeStatus, ChallengeView } from "@/api/challenges/types"
import { useChallenge } from "@/api/challenges/useChallenge"
import { AddressIcon } from "@/components/AddressIcon"
import { OverlappedAppsImages } from "@/components/OverlappedAppsImages"

import { AddChallengeInvitesModal } from "./AddChallengeInvitesModal"
import { ChallengeActions, hasChallengeActions } from "./ChallengeActions"
import { ChallengeKindBadges, ChallengeStatusBadge, ChallengeVisibilityBadge } from "./ChallengeStatusBadges"

export const ChallengeCard = ({ challenge, currentRound }: { challenge: ChallengeView; currentRound: number }) => {
  const { t } = useTranslation()
  const createdAtLabel = challenge.createdAt > 0 ? dayjs.unix(challenge.createdAt).format("D MMM, YYYY") : null
  const isSponsored = challenge.kind === ChallengeKind.Sponsored
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
        _before={{
          content: '""',
          position: "absolute",
          top: "-12",
          insetInlineEnd: "-10",
          boxSize: "36",
          borderRadius: "full",
          bg: "brand.primary",
          opacity: "0.08",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
        _hover={{ borderColor: "border.active", boxShadow: "lg", transform: "translateY(-2px)" }}>
        <VStack align="stretch" gap="5" h="full" position="relative">
          <HStack justify="space-between" align="center">
            <HStack gap="3" align="center">
              <ChallengeVisibilityBadge challenge={challenge} />
              <Heading size="lg">
                <LinkOverlay asChild>
                  <NextLink href={`/challenges/${challenge.challengeId}`}>
                    {t("Challenge #{{id}}", { id: challenge.challengeId })}
                  </NextLink>
                </LinkOverlay>
              </Heading>
            </HStack>
            <ChallengeStatusBadge challenge={challenge} />
          </HStack>

          <VStack align="stretch" gap="3">
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
            </HStack>
            {showParticipatingBadge && (
              <HStack
                alignSelf="start"
                gap="2"
                bg="status.positive.subtle"
                color="status.positive.strong"
                borderRadius="full"
                px="3"
                py="1.5">
                <Box boxSize="2" borderRadius="full" bg="status.positive.strong" />
                <Text textStyle="xs" fontWeight="semibold">
                  {t("Participating")}
                </Text>
              </HStack>
            )}
          </VStack>

          <SimpleGrid columns={2} gap="3">
            <Box bg="bg.secondary" borderRadius="xl" px="4" py="3">
              <Text
                textStyle="xxs"
                color="text.subtle"
                textTransform="uppercase"
                letterSpacing="0.08em"
                fontWeight="semibold">
                {t("Prize")}
              </Text>
              <Text textStyle="lg" fontWeight="bold" color="brand.primary" mt="1">
                {humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
              </Text>
            </Box>
            {!isSponsored && (
              <Box bg="bg.secondary" borderRadius="xl" px="4" py="3">
                <Text
                  textStyle="xxs"
                  color="text.subtle"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  fontWeight="semibold">
                  {t("Stake")}
                </Text>
                <Text textStyle="lg" fontWeight="bold" mt="1">
                  {humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")}
                </Text>
              </Box>
            )}
            <Box bg="bg.secondary" borderRadius="xl" px="4" py="3">
              <Text
                textStyle="xxs"
                color="text.subtle"
                textTransform="uppercase"
                letterSpacing="0.08em"
                fontWeight="semibold">
                {t("Apps")}
              </Text>
              {challenge.allApps ? (
                <Text textStyle="lg" fontWeight="bold" mt="1">
                  {t("All apps")}
                </Text>
              ) : isSelectedAppsLoading ? (
                <Box mt="2">
                  <OverlappedAppsImages appsIds={[]} isLoading maxAppsToShow={4} iconSize={26} />
                </Box>
              ) : challengeDetail?.selectedApps.length ? (
                <Box mt="2">
                  <OverlappedAppsImages appsIds={challengeDetail.selectedApps} maxAppsToShow={4} iconSize={26} />
                </Box>
              ) : (
                <Text textStyle="lg" fontWeight="bold" mt="1">
                  {humanNumber(challenge.selectedAppsCount)}
                </Text>
              )}
            </Box>
            <Box
              bg="bg.secondary"
              borderRadius="xl"
              px="4"
              py="3"
              pe={challenge.canAddInvites ? "14" : "4"}
              position="relative">
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
                  existingInvitees={"invited" in challenge ? (challenge as ChallengeDetail).invited : undefined}>
                  <IconButton
                    position="absolute"
                    top="50%"
                    right="3"
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
              <Text textStyle="lg" fontWeight="bold" mt="1">
                {humanNumber(challenge.participantCount)} {"/"} {humanNumber(challenge.maxParticipants)}
              </Text>
            </Box>
            <Box bg="bg.secondary" borderRadius="xl" px="4" py="3">
              <Text
                textStyle="xxs"
                color="text.subtle"
                textTransform="uppercase"
                letterSpacing="0.08em"
                fontWeight="semibold">
                {t("Rounds")}
              </Text>
              <Text textStyle="lg" fontWeight="bold" mt="1">
                {roundsProgress}
              </Text>
            </Box>
          </SimpleGrid>

          <ChallengeKindBadges challenge={challenge} />

          {hasChallengeActions(challenge) && (
            <Box mt="auto" pt="5" borderTopWidth="1px" borderColor="border.secondary">
              <ChallengeActions challenge={challenge} layout="card" />
            </Box>
          )}
        </VStack>
      </Card.Root>
    </LinkBox>
  )
}
