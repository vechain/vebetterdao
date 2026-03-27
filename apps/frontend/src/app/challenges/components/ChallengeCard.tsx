"use client"

import { Badge, Box, Card, Heading, HStack, LinkBox, LinkOverlay, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import {
  ChallengeKind,
  ChallengeStatus,
  ChallengeVisibility,
  ChallengeView,
  challengeKindLabel,
  challengeStatusLabel,
  challengeVisibilityLabel,
} from "@/api/challenges/types"

import { ChallengeActions, hasChallengeActions } from "./ChallengeActions"
import {
  getChallengeKindBadgeVariant,
  getChallengeStatusBadgeVariant,
  getChallengeVisibilityBadgeVariant,
} from "./challengeBadgeVariants"

export const ChallengeCard = ({ challenge, currentRound }: { challenge: ChallengeView; currentRound: number }) => {
  const { t } = useTranslation()
  const createdAtLabel = challenge.createdAt > 0 ? dayjs.unix(challenge.createdAt).format("D MMM, YYYY") : null
  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const roundsProgress =
    currentRound > 0 && challenge.duration > 0
      ? `${Math.min(Math.max(currentRound - challenge.startRound + 1, 0), challenge.duration)} / ${challenge.duration}`
      : `${challenge.startRound}-${challenge.endRound}`
  const kindBadgeVariant = isSponsored ? "positive" : getChallengeKindBadgeVariant(challenge.kind)
  const visibilityBadgeVariant =
    challenge.visibility === ChallengeVisibility.Private
      ? "neutral"
      : getChallengeVisibilityBadgeVariant(challenge.visibility)
  const showStatusBadge = challenge.status !== ChallengeStatus.Active

  return (
    <LinkBox h="full">
      <Card.Root variant="primary" p={{ base: "6", md: "7" }} gap="5" h="full" borderRadius="3xl" boxShadow="sm">
        <VStack align="stretch" gap="5" h="full">
          <HStack flexWrap="wrap" gap="2">
            <Badge variant={kindBadgeVariant} size="sm">
              {t(challengeKindLabel(challenge.kind))}
            </Badge>
            <Badge variant={visibilityBadgeVariant} size="sm">
              {t(challengeVisibilityLabel(challenge.visibility))}
            </Badge>
            {showStatusBadge && (
              <Badge variant={getChallengeStatusBadgeVariant(challenge.status)} size="sm">
                {t(challengeStatusLabel(challenge.status))}
              </Badge>
            )}
          </HStack>

          <VStack align="stretch" gap="3">
            <Heading size="lg">
              <LinkOverlay asChild>
                <NextLink href={`/challenges/${challenge.challengeId}`}>
                  {t("Challenge #{{id}}", { id: challenge.challengeId })}
                </NextLink>
              </LinkOverlay>
            </Heading>
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
            {challenge.isJoined && (
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

          <SimpleGrid columns={2} gapX={{ base: "6", md: "8" }} gapY="4">
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
          </SimpleGrid>

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
