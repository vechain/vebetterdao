"use client"

import { Card, HStack, LinkBox, LinkOverlay, Text, VStack } from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { ChallengeKind, ChallengeView } from "@/api/challenges/types"

import { ChallengeActions, hasChallengeActions } from "./ChallengeActions"
import { ChallengeStatusBadges } from "./ChallengeStatusBadges"

export const ChallengeCompactCard = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()
  const isSponsored = challenge.kind === ChallengeKind.Sponsored

  return (
    <LinkBox>
      <Card.Root
        variant="primary"
        px={{ base: "4", md: "5" }}
        py={{ base: "4", md: "4" }}
        borderRadius="2xl"
        transition="all 0.15s ease"
        _hover={{ borderColor: "border.active", boxShadow: "md" }}>
        <HStack gap={{ base: "3", md: "5" }} align="center" flexWrap={{ base: "wrap", md: "nowrap" }}>
          <VStack align="start" gap="1" flex="1" minW="0">
            <LinkOverlay asChild>
              <NextLink href={`/challenges/${challenge.challengeId}`}>
                <Text textStyle="md" fontWeight="bold" truncate>
                  {t("Challenge #{{id}}", { id: challenge.challengeId })}
                </Text>
              </NextLink>
            </LinkOverlay>
            <HStack gap="1.5" flexWrap="wrap">
              <ChallengeStatusBadges challenge={challenge} />
            </HStack>
          </VStack>

          <HStack gap={{ base: "4", md: "6" }} flexShrink={0} flexWrap={{ base: "wrap", md: "nowrap" }}>
            <VStack align="start" gap="0">
              <Text textStyle="xxs" color="text.subtle" fontWeight="semibold" textTransform="uppercase">
                {t("Prize")}
              </Text>
              <Text textStyle="sm" fontWeight="bold" color="brand.primary">
                {humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
              </Text>
            </VStack>
            {!isSponsored && (
              <VStack align="start" gap="0">
                <Text textStyle="xxs" color="text.subtle" fontWeight="semibold" textTransform="uppercase">
                  {t("Stake")}
                </Text>
                <Text textStyle="sm" fontWeight="bold">
                  {humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")}
                </Text>
              </VStack>
            )}
            <VStack align="start" gap="0">
              <Text textStyle="xxs" color="text.subtle" fontWeight="semibold" textTransform="uppercase">
                {t("Participants")}
              </Text>
              <Text textStyle="sm" fontWeight="bold">
                {humanNumber(challenge.participantCount)}
              </Text>
            </VStack>
            <VStack align="start" gap="0">
              <Text textStyle="xxs" color="text.subtle" fontWeight="semibold" textTransform="uppercase">
                {t("Created by")}
              </Text>
              <Text textStyle="sm" fontWeight="semibold" color="text.subtle">
                {humanAddress(challenge.creator, 4, 4)}
              </Text>
            </VStack>
          </HStack>

          {hasChallengeActions(challenge) && (
            <HStack flexShrink={0}>
              <ChallengeActions challenge={challenge} layout="default" />
            </HStack>
          )}
        </HStack>
      </Card.Root>
    </LinkBox>
  )
}
