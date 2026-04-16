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
  Stack,
  Text,
  useDisclosure,
  VStack,
  Wrap,
} from "@chakra-ui/react"
import { humanAddress, humanNumber } from "@repo/utils/FormattingUtils"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { LuPlus } from "react-icons/lu"

import {
  ChallengeKind,
  ParticipantStatus,
  ChallengeStatus,
  ChallengeView,
  ChallengeVisibility,
  ThresholdMode,
} from "@/api/challenges/types"
import { useChallengeActions } from "@/api/challenges/useChallengeActions"
import { AddressIcon } from "@/components/AddressIcon"

import { ChallengeClaimModal } from "../[challengeId]/components/ChallengeClaimModal"
import { AddChallengeInvitesModal } from "../shared/AddChallengeInvitesModal"
import { ChallengeActions, hasChallengeActions } from "../shared/ChallengeActions"
import { ChallengeStatTile } from "../shared/ChallengeStatTile"
import { ChallengeStatusBadge, ChallengeVisibilityBadge } from "../shared/ChallengeStatusBadges"
import { SponsoredChallengeInfo } from "../shared/SponsoredChallengeInfo"

export const ChallengeCompactCard = ({ challenge }: { challenge: ChallengeView }) => {
  const { t } = useTranslation()
  const actions = useChallengeActions()
  const { onOpen: onClaimOpen, onClose: onClaimClose, open: isClaimOpen } = useDisclosure()
  const isSponsored = challenge.kind === ChallengeKind.Sponsored
  const winnerTypeLabel = t(
    challenge.thresholdMode === ThresholdMode.SplitAboveThreshold ? "Split prize" : "Max actions",
  )
  const showParticipatingBadge =
    challenge.isJoined && challenge.status !== ChallengeStatus.Cancelled && challenge.status !== ChallengeStatus.Invalid
  const showSponsoringBadge = isSponsored && challenge.isCreator
  const showInviteStats = challenge.visibility === ChallengeVisibility.Private
  const isReacceptingInvite = challenge.canAccept && challenge.viewerStatus === ParticipantStatus.Declined
  const challengeTitle = challenge.title || t("Challenge #{{id}}", { id: challenge.challengeId })

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
        _hover={{ borderColor: "border.active", boxShadow: "lg", transform: "translateY(-2px)" }}>
        <VStack gap={{ base: "5", md: "6" }} align="stretch" h="full" position="relative">
          <Stack
            direction={isReacceptingInvite ? "column" : { base: "column", md: "row" }}
            justify="space-between"
            align={isReacceptingInvite ? "stretch" : { base: "stretch", md: "start" }}
            gap="4">
            <VStack align="start" gap="3" flex="1" minW="0">
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
              <LinkOverlay asChild>
                <NextLink href={`/challenges/${challenge.challengeId}`}>
                  <Heading
                    textStyle={{ base: "xl", md: "2xl" }}
                    lineHeight="1.1"
                    lineClamp={2}
                    title={challengeTitle}
                    wordBreak="break-word"
                    overflowWrap="anywhere">
                    {challengeTitle}
                  </Heading>
                </NextLink>
              </LinkOverlay>
              <Wrap gap="2">
                <HStack gap="1.5" bg="bg.secondary" borderRadius="full" px="2.5" py="1.5">
                  <AddressIcon address={challenge.creator} boxSize="4" borderRadius="full" />
                  <Text textStyle="xs" color="text.subtle" fontWeight="semibold">
                    {humanAddress(challenge.creator, 4, 4)}
                  </Text>
                </HStack>
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
            {hasChallengeActions(challenge) && (
              <Box w={isReacceptingInvite ? "full" : { base: "full", md: "auto" }} flexShrink={0}>
                <ChallengeActions
                  challenge={challenge}
                  layout="default"
                  buttonSize="md"
                  onClaimClick={challenge.canClaim ? onClaimOpen : undefined}
                />
              </Box>
            )}
          </Stack>

          <SimpleGrid columns={2} gap="3" mt="auto">
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
              label={t("Participants")}
              action={
                challenge.canAddInvites ? (
                  <AddChallengeInvitesModal challengeId={challenge.challengeId} creatorAddress={challenge.creator}>
                    <IconButton
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
                ) : undefined
              }
              helper={
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
              }>
              <Text textStyle={{ base: "lg", md: "xl" }} fontWeight="bold" lineHeight="1.15">
                {humanNumber(challenge.participantCount)}
                <Text as="span" color="text.subtle" fontWeight="semibold">
                  {" / "} {humanNumber(challenge.maxParticipants)}
                </Text>
              </Text>
            </ChallengeStatTile>
            <ChallengeStatTile
              label={t("Apps")}
              value={challenge.allApps ? t("All apps") : humanNumber(challenge.selectedAppsCount)}
              helper={
                !challenge.allApps ? (
                  <Text textStyle="xs" color="text.subtle">
                    {t("Selected apps")}
                  </Text>
                ) : undefined
              }
            />
          </SimpleGrid>

          <Wrap gap="2">
            <Badge variant="neutral" size="sm">
              {t("Winner")} {winnerTypeLabel}
            </Badge>
            {challenge.threshold !== "0" && (
              <Badge variant="neutral" size="sm">
                {t("Minimum actions")} {humanNumber(challenge.threshold)}
              </Badge>
            )}
          </Wrap>
        </VStack>
      </Card.Root>

      <ChallengeClaimModal
        isOpen={isClaimOpen}
        onClose={onClaimClose}
        prizeLabel={humanNumber(challenge.totalPrize, challenge.totalPrize, "B3TR")}
        onClaim={() => actions.claimChallenge(challenge.challengeId)}
      />
    </LinkBox>
  )
}
