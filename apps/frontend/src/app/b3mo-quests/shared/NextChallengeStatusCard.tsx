"use client"

import { Button, Card, Heading, HStack, Icon, Link, Skeleton, SkeletonText, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { LuFlag, LuSparkles } from "react-icons/lu"

import { NextChallengeStatus } from "@/api/challenges/nextChallengeStatus"

interface NextChallengeStatusCardProps {
  status: NextChallengeStatus | null
  isLoading?: boolean
  title?: string
}

/** Compact, reusable presentation of the wallet's highest-priority Quest state. */
export const NextChallengeStatusCard = ({ status, isLoading = false, title }: NextChallengeStatusCardProps) => {
  const { t } = useTranslation()

  if (!isLoading && !status) return null

  const challenge = status?.challenge
  const challengeTitle =
    challenge?.title || (challenge ? t("B3MO Quest #{{id}}", { id: challenge.challengeId }) : undefined)

  return (
    <Card.Root w="full" variant="primary" data-testid="next-challenge-status-card">
      <Card.Body>
        <VStack gap="4" align="stretch">
          <HStack gap="2">
            <Icon boxSize="5" color="brand.secondary">
              <LuSparkles />
            </Icon>
            <Heading size="xl">{title ?? t("Your B3MO Quests")}</Heading>
          </HStack>

          {isLoading ? (
            <VStack align="stretch" gap="3">
              <Skeleton h="5" w={{ base: "70%", md: "45%" }} />
              <SkeletonText noOfLines={2} gap="2" />
              <Skeleton h="9" w={{ base: "full", md: "36" }} borderRadius="md" />
            </VStack>
          ) : (
            status &&
            challenge && (
              <VStack align="stretch" gap="3">
                <HStack gap="3" align="start">
                  <Icon boxSize="5" mt="0.5" color="brand.primary" flexShrink="0">
                    <LuFlag />
                  </Icon>
                  <VStack align="start" gap="1" minW="0">
                    <Text fontWeight="semibold" lineClamp={1} title={challengeTitle}>
                      {challengeTitle}
                    </Text>
                    <Text textStyle="sm" color="text.subtle">
                      {t(status.messageKey, status.messageValues)}
                    </Text>
                  </VStack>
                </HStack>

                <HStack gap="3" flexWrap="wrap">
                  <Button asChild variant="primary" size="sm" minH="11">
                    <NextLink href={`/b3mo-quests/${challenge.challengeId}`} data-cy="quest-next-move-details">
                      {t("View details")}
                    </NextLink>
                  </Button>
                  <Link
                    asChild
                    variant="plain"
                    color="actions.secondary.text-lighter"
                    fontWeight="semibold"
                    minH="11"
                    display="inline-flex"
                    alignItems="center">
                    <NextLink href="/b3mo-quests" data-cy="quest-next-move-all">
                      {t("See all")}
                    </NextLink>
                  </Link>
                </HStack>
              </VStack>
            )
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
