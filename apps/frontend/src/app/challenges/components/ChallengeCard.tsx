"use client"

import { Badge, Card, Heading, HStack, LinkBox, LinkOverlay, SimpleGrid, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import {
  ChallengeView,
  challengeKindLabel,
  challengeStatusLabel,
  challengeVisibilityLabel,
} from "@/api/challenges/types"

import { ChallengeActions } from "./ChallengeActions"

export const ChallengeCard = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()

  return (
    <LinkBox>
      <Card.Root variant="subtle" p={{ base: "4", md: "6" }} gap="4">
        <VStack align="stretch" gap="4">
          <HStack flexWrap="wrap" gap="2">
            <Badge variant="subtle" rounded="sm">
              {t(challengeKindLabel(challenge.kind))}
            </Badge>
            <Badge variant="subtle" rounded="sm">
              {t(challengeVisibilityLabel(challenge.visibility))}
            </Badge>
            <Badge variant="subtle" rounded="sm">
              {t(challengeStatusLabel(challenge.status))}
            </Badge>
            {challenge.isInvitationPending && (
              <Badge variant="solid" rounded="sm">
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
          </VStack>

          <SimpleGrid columns={{ base: 2, md: 4 }} gap="3">
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

          <ChallengeActions challenge={challenge} />
        </VStack>
      </Card.Root>
    </LinkBox>
  )
}
