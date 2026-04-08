"use client"

import { Box, Card, Heading, IconButton, LinkBox, LinkOverlay, SimpleGrid, Stack, Text, VStack } from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { LuPlus } from "react-icons/lu"

import { ChallengeKind, ChallengeView } from "@/api/challenges/types"

import { AddChallengeInvitesModal } from "./AddChallengeInvitesModal"
import { ChallengeActions, hasChallengeActions } from "./ChallengeActions"
import { ChallengeStatusBadge, ChallengeVisibilityBadge } from "./ChallengeStatusBadges"

export const ChallengeCompactCard = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()
  const isSponsored = challenge.kind === ChallengeKind.Sponsored

  return (
    <LinkBox h="full">
      <Card.Root
        variant="primary"
        px={{ base: "5", md: "6" }}
        py={{ base: "5", md: "6" }}
        borderRadius="3xl"
        transition="all 0.2s ease"
        h="full"
        position="relative"
        overflow="hidden"
        boxShadow="sm"
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
        <VStack gap={{ base: "5", md: "6" }} align="stretch" h="full" position="relative">
          <Stack
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "stretch", md: "start" }}
            gap="4">
            <VStack align="start" gap="3" flex="1" minW="0">
              <LinkOverlay asChild>
                <NextLink href={`/challenges/${challenge.challengeId}`}>
                  <Heading textStyle={{ base: "xl", md: "2xl" }} lineHeight="1.1">
                    {t("Challenge #{{id}}", { id: challenge.challengeId })}
                  </Heading>
                </NextLink>
              </LinkOverlay>
              <Stack direction="row" flexWrap="wrap" gap="2">
                <ChallengeVisibilityBadge challenge={challenge} />
                <ChallengeStatusBadge challenge={challenge} />
              </Stack>
            </VStack>
            {hasChallengeActions(challenge) && (
              <Box w={{ base: "full", md: "auto" }} flexShrink={0}>
                <ChallengeActions challenge={challenge} layout="default" buttonSize="md" />
              </Box>
            )}
          </Stack>

          <SimpleGrid columns={2} gap="3" mt="auto">
            <Box
              bg="bg.secondary"
              borderRadius="2xl"
              border="sm"
              borderColor="border.secondary"
              px={{ base: "4", md: "5" }}
              py="4">
              <Text
                textStyle="xxs"
                color="text.subtle"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="0.08em">
                {t("Prize")}
              </Text>
              <Text
                textStyle={{ base: "lg", md: "xl" }}
                fontWeight="bold"
                color="brand.primary"
                mt="2"
                lineHeight="1.15">
                {humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
              </Text>
            </Box>
            <Box
              bg="bg.secondary"
              borderRadius="2xl"
              border="sm"
              borderColor="border.secondary"
              px={{ base: "4", md: "5" }}
              py="4">
              <Text
                textStyle="xxs"
                color="text.subtle"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="0.08em">
                {t(isSponsored ? "Type" : "Stake")}
              </Text>
              <Text
                textStyle={isSponsored ? { base: "sm", md: "md" } : { base: "lg", md: "xl" }}
                fontWeight="bold"
                mt="2"
                lineHeight="1.15">
                {isSponsored
                  ? t("Sponsored challenge: No stake required!")
                  : humanNumber(challenge.stakeAmount, challenge.stakeAmount, "B3TR")}
              </Text>
            </Box>
            <Box
              bg="bg.secondary"
              borderRadius="2xl"
              border="sm"
              borderColor="border.secondary"
              px={{ base: "4", md: "5" }}
              py="4"
              pe={challenge.canAddInvites ? "14" : undefined}
              position="relative">
              <Text
                textStyle="xxs"
                color="text.subtle"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="0.08em">
                {t("Participants")}
              </Text>
              <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold" mt="2" lineHeight="1.15">
                {humanNumber(challenge.participantCount)}
                <Text as="span" color="text.subtle" fontWeight="semibold">
                  {" / "} {humanNumber(challenge.maxParticipants)}
                </Text>
              </Text>
              {challenge.canAddInvites && (
                <AddChallengeInvitesModal challengeId={challenge.challengeId} creatorAddress={challenge.creator}>
                  <IconButton
                    position="absolute"
                    top="50%"
                    right="4"
                    transform="translateY(-50%)"
                    minW="9"
                    h="9"
                    p="0"
                    borderRadius="full"
                    bg="actions.primary.default"
                    color="actions.primary.text"
                    _hover={{ bg: "actions.primary.hover" }}
                    _active={{ bg: "actions.primary.pressed" }}
                    aria-label={t("Add invitee")}>
                    <LuPlus />
                  </IconButton>
                </AddChallengeInvitesModal>
              )}
            </Box>
            <Box
              bg="bg.secondary"
              borderRadius="2xl"
              border="sm"
              borderColor="border.secondary"
              px={{ base: "4", md: "5" }}
              py="4">
              <Text
                textStyle="xxs"
                color="text.subtle"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="0.08em">
                {t("Created by")}
              </Text>
              <Text textStyle={{ base: "md", md: "lg" }} fontWeight="semibold" mt="2" lineHeight="1.15">
                {humanAddress(challenge.creator, 4, 4)}
              </Text>
            </Box>
          </SimpleGrid>
        </VStack>
      </Card.Root>
    </LinkBox>
  )
}
