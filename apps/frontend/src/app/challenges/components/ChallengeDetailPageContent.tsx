"use client"

import { Badge, Box, Button, Card, Heading, HStack, Icon, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import NextLink from "next/link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaAngleLeft } from "react-icons/fa6"

import { ChallengeKind, ChallengeStatus } from "@/api/challenges/types"
import { useChallenge } from "@/api/challenges/useChallenge"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { MotionVStack } from "@/components/MotionVStack"

import { ChallengeActions, hasChallengeActions } from "./ChallengeActions"
import { ChallengeParticipantActionsSection } from "./ChallengeParticipantActionsSection"
import { ChallengeStatusBadges } from "./ChallengeStatusBadges"

export const ChallengeDetailPageContent = ({ challengeId }: { challengeId: string }) => {
  const { account } = useWallet()
  const viewerAddress = account?.address
  const { data: challenge, isLoading } = useChallenge(challengeId, viewerAddress)
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
        <Card.Root variant="primary" p={{ base: "6", md: "7" }} w="full" borderRadius="3xl" boxShadow="sm">
          <Skeleton h="360px" borderRadius="2xl" />
        </Card.Root>
      </MotionVStack>
    )
  }

  if (!challenge) {
    return (
      <MotionVStack renderInnerStack={false} gap="6">
        <Card.Root variant="primary" p={{ base: "6", md: "7" }} w="full" borderRadius="3xl" boxShadow="sm">
          <Heading size="md">{t("Challenge not found")}</Heading>
        </Card.Root>
      </MotionVStack>
    )
  }

  const createdAtLabel = challenge.createdAt > 0 ? dayjs.unix(challenge.createdAt).format("D MMM, YYYY") : null
  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const roundsProgress =
    currentRound > 0 && challenge.duration > 0
      ? `${Math.min(Math.max(currentRound - challenge.startRound + 1, 0), challenge.duration)} / ${challenge.duration}`
      : `${challenge.startRound}-${challenge.endRound}`
  const showParticipatingBadge =
    challenge.isJoined && challenge.status !== ChallengeStatus.Cancelled && challenge.status !== ChallengeStatus.Invalid

  return (
    <MotionVStack renderInnerStack={false} gap="6">
      <VStack align="stretch" w="full" gap="5">
        <Button asChild w="fit-content" variant="ghost" px="0">
          <NextLink href="/challenges/all">
            <Icon as={FaAngleLeft} boxSize={3} />
            <Text color="inherit" textStyle="sm" fontWeight="semibold">
              {t("Back to challenges")}
            </Text>
          </NextLink>
        </Button>

        <Card.Root variant="primary" p={{ base: "6", md: "7" }} gap="5" borderRadius="3xl" boxShadow="sm">
          <VStack align="stretch" gap="5">
            <ChallengeStatusBadges challenge={challenge} />

            <VStack align="stretch" gap="3">
              <Heading size="xl">{t("Challenge #{{id}}", { id: challenge.challengeId })}</Heading>
              <HStack flexWrap="wrap" gap="2">
                <Text
                  textStyle="xs"
                  color="text.subtle"
                  bg="bg.secondary"
                  borderRadius="full"
                  px="2.5"
                  py="1"
                  fontWeight="semibold">
                  {humanAddress(challenge.creator, 6, 4)}
                </Text>
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

            <SimpleGrid columns={{ base: 2, md: 3 }} gapX={{ base: "6", md: "8" }} gapY="4">
              <VStack align="start" gap="1">
                <Text
                  textStyle="xxs"
                  color="text.subtle"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  fontWeight="semibold">
                  {t("Prize")}
                </Text>
                <Text textStyle="lg" fontWeight="bold" color="brand.primary">
                  {humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
                </Text>
              </VStack>
              {!isSponsored && (
                <VStack align="start" gap="1">
                  <Text
                    textStyle="xxs"
                    color="text.subtle"
                    textTransform="uppercase"
                    letterSpacing="0.08em"
                    fontWeight="semibold">
                    {t("Stake")}
                  </Text>
                  <Text textStyle="lg" fontWeight="bold">
                    {humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")}
                  </Text>
                </VStack>
              )}
              <VStack align="start" gap="1">
                <Text
                  textStyle="xxs"
                  color="text.subtle"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  fontWeight="semibold">
                  {t("Participants")}
                </Text>
                <Text textStyle="lg" fontWeight="bold">
                  {humanNumber(challenge.participantCount)}
                </Text>
              </VStack>
              <VStack align="start" gap="1">
                <Text
                  textStyle="xxs"
                  color="text.subtle"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  fontWeight="semibold">
                  {t("Rounds")}
                </Text>
                <Text textStyle="lg" fontWeight="bold">
                  {roundsProgress}
                </Text>
              </VStack>
              <VStack align="start" gap="1">
                <Text
                  textStyle="xxs"
                  color="text.subtle"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  fontWeight="semibold">
                  {t("Threshold")}
                </Text>
                <Text textStyle="lg" fontWeight="bold">
                  {challenge.threshold === "0" ? t("None") : humanNumber(challenge.threshold)}
                </Text>
              </VStack>
              <VStack align="start" gap="1">
                <Text
                  textStyle="xxs"
                  color="text.subtle"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                  fontWeight="semibold">
                  {t("Apps")}
                </Text>
                <Text textStyle="lg" fontWeight="bold">
                  {challenge.allApps ? t("All apps") : humanNumber(challenge.selectedApps.length)}
                </Text>
              </VStack>
            </SimpleGrid>

            {hasChallengeActions(challenge) && (
              <Box pt="5" borderTopWidth="1px" borderColor="border.secondary">
                <ChallengeActions challenge={challenge} layout="card" />
              </Box>
            )}
          </VStack>
        </Card.Root>

        <ChallengeParticipantActionsSection challenge={challenge} />

        <SimpleGrid columns={{ base: 1, lg: challenge.invited.length > 0 ? 2 : 1 }} gap="4">
          <Card.Root variant="primary" p={{ base: "6", md: "7" }} gap="4" borderRadius="3xl" boxShadow="sm">
            <VStack align="stretch" gap="4">
              <Text
                textStyle="xxs"
                color="text.subtle"
                textTransform="uppercase"
                letterSpacing="0.08em"
                fontWeight="semibold">
                {t("Selected apps")}
              </Text>
              <HStack flexWrap="wrap" gap="2">
                {challenge.allApps ? (
                  <Badge variant="neutral" size="sm">
                    {t("All apps")}
                  </Badge>
                ) : (
                  challenge.selectedApps.map(app => (
                    <Badge key={app} variant="neutral" size="sm">
                      {appNames.get(app.toLowerCase()) ?? humanAddress(app, 6, 4)}
                    </Badge>
                  ))
                )}
              </HStack>
            </VStack>
          </Card.Root>

          {challenge.invited.length > 0 && (
            <Card.Root variant="primary" p={{ base: "6", md: "7" }} gap="4" borderRadius="3xl" boxShadow="sm">
              <VStack align="stretch" gap="4">
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
      </VStack>
    </MotionVStack>
  )
}
