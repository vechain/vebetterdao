"use client"

import { Badge, Box, Card, Heading, HStack, LinkBox, LinkOverlay, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import {
  ChallengeView,
  challengeKindLabel,
  challengeStatusLabel,
  challengeVisibilityLabel,
} from "@/api/challenges/types"

import { ChallengeActions } from "./ChallengeActions"
import {
  getChallengeKindBadgeVariant,
  getChallengeStatusBadgeVariant,
  getChallengeVisibilityBadgeVariant,
} from "./challengeBadgeVariants"

export const ChallengeCard = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()

  return (
    <LinkBox h="full">
      <Card.Root variant="subtle" p={{ base: "4", md: "6" }} gap="4" h="full">
        <VStack align="stretch" gap="4" h="full">
          <HStack flexWrap="wrap" gap="2">
            <Badge variant={getChallengeKindBadgeVariant(challenge.kind)} rounded="sm">
              {t(challengeKindLabel(challenge.kind))}
            </Badge>
            <Badge variant={getChallengeVisibilityBadgeVariant(challenge.visibility)} rounded="sm">
              {t(challengeVisibilityLabel(challenge.visibility))}
            </Badge>
            <Badge variant={getChallengeStatusBadgeVariant(challenge.status)} rounded="sm">
              {t(challengeStatusLabel(challenge.status))}
            </Badge>
            {challenge.isInvitationPending && (
              <Badge variant="warning" rounded="sm">
                {t("Pending invitation")}
              </Badge>
            )}
          </HStack>

          <VStack align="stretch" gap="2">
            <Heading size="md">
              <LinkOverlay asChild>
                <NextLink href={`/challenges/${challenge.challengeId}`}>
                  {t("Challenge #{{id}}", { id: challenge.challengeId })}
                </NextLink>
              </LinkOverlay>
            </Heading>
            <Text color="text.subtle" textStyle="sm">
              {t("Created by")} {humanAddress(challenge.creator, 6, 4)}
            </Text>
            {challenge.createdAt > 0 && (
              <Text color="text.subtle" textStyle="sm">
                {t("Created")} {dayjs.unix(challenge.createdAt).format("D MMM, YYYY")}
              </Text>
            )}
          </VStack>

          <SimpleGrid columns={{ base: 2, md: 5 }} gap="3">
            <VStack align="start" gap="0">
              <Text textStyle="xs" color="text.subtle">
                {t("Prize")}
              </Text>
              <Text textStyle="sm" fontWeight="semibold">
                {challenge.totalPrize} {"B3TR"}
              </Text>
            </VStack>
            <VStack align="start" gap="0">
              <Text textStyle="xs" color="text.subtle">
                {t("Stake")}
              </Text>
              <Text textStyle="sm" fontWeight="semibold">
                {challenge.stakeAmount} {"B3TR"}
              </Text>
            </VStack>
            <VStack align="start" gap="0">
              <Text textStyle="xs" color="text.subtle">
                {t("Participants")}
              </Text>
              <Text textStyle="sm" fontWeight="semibold">
                {challenge.participantCount}
              </Text>
            </VStack>
            <VStack align="start" gap="0">
              <Text textStyle="xs" color="text.subtle">
                {t("Rounds")}
              </Text>
              <Text textStyle="sm" fontWeight="semibold">
                {challenge.startRound}
                {"-"}
                {challenge.endRound}
              </Text>
            </VStack>
            <VStack align="start" gap="0">
              <Text textStyle="xs" color="text.subtle">
                {t("Apps")}
              </Text>
              <Text textStyle="sm" fontWeight="semibold">
                {challenge.allApps ? t("All") : challenge.selectedAppsCount}
              </Text>
            </VStack>
          </SimpleGrid>

          <Box mt="auto">
            <ChallengeActions challenge={challenge} />
          </Box>
        </VStack>
      </Card.Root>
    </LinkBox>
  )
}
