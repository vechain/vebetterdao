"use client"

import { Card, HStack, IconButton, LinkBox, LinkOverlay, Text, VStack } from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { LuPlus } from "react-icons/lu"

import { ChallengeKind, ChallengeView } from "@/api/challenges/types"

import { AddChallengeInvitesModal } from "./AddChallengeInvitesModal"
import { ChallengeActions, hasChallengeActions } from "./ChallengeActions"
import { ChallengeStatusBadges } from "./ChallengeStatusBadges"

export const ChallengeCompactCard = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()
  const isSponsored = challenge.kind === ChallengeKind.Sponsored

  return (
    <LinkBox>
      <Card.Root
        variant="primary"
        px="4"
        py="4"
        borderRadius="2xl"
        transition="all 0.15s ease"
        h="full"
        _hover={{ borderColor: "border.active", boxShadow: "md" }}>
        <VStack gap="3" align="stretch" h="full">
          <HStack justify="space-between" align="start">
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
            {hasChallengeActions(challenge) && <ChallengeActions challenge={challenge} layout="default" />}
          </HStack>

          <HStack gap="4" flexWrap="wrap" mt="auto">
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
            <HStack gap="1" align="end">
              <VStack align="start" gap="0">
                <Text textStyle="xxs" color="text.subtle" fontWeight="semibold" textTransform="uppercase">
                  {t("Participants")}
                </Text>
                <Text textStyle="sm" fontWeight="bold">
                  {humanNumber(challenge.participantCount)}
                </Text>
              </VStack>
              {challenge.canAddInvites && (
                <AddChallengeInvitesModal challengeId={challenge.challengeId} creatorAddress={challenge.creator}>
                  <IconButton size="2xs" variant="ghost" borderRadius="full" aria-label={t("Add invitee")}>
                    <LuPlus />
                  </IconButton>
                </AddChallengeInvitesModal>
              )}
            </HStack>
            <VStack align="start" gap="0">
              <Text textStyle="xxs" color="text.subtle" fontWeight="semibold" textTransform="uppercase">
                {t("Created by")}
              </Text>
              <Text textStyle="sm" fontWeight="semibold" color="text.subtle">
                {humanAddress(challenge.creator, 4, 4)}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Card.Root>
    </LinkBox>
  )
}
