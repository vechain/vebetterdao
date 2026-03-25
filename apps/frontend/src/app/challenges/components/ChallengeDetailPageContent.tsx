"use client"

import { Badge, Button, Card, Heading, HStack, Icon, SimpleGrid, Skeleton, Text, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { FaAngleLeft } from "react-icons/fa6"

import { challengeKindLabel, challengeStatusLabel, challengeVisibilityLabel } from "@/api/challenges/types"
import { useChallenge } from "@/api/challenges/useChallenge"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { MotionVStack } from "@/components/MotionVStack"

import { ChallengeActions } from "./ChallengeActions"

export const ChallengeDetailPageContent = ({ challengeId }: { challengeId: string }) => {
  const { account } = useWallet()
  const viewerAddress = account?.address
  const { data: challenge, isLoading } = useChallenge(challengeId, viewerAddress)
  const { data: appsData } = useXApps()
  const { t } = useTranslation()
  const appNames = new Map((appsData?.allApps ?? []).map(app => [app.id.toLowerCase(), app.name]))

  if (isLoading) {
    return (
      <MotionVStack renderInnerStack={false} gap="6">
        <Card.Root p="6" w="full">
          <Skeleton h="320px" />
        </Card.Root>
      </MotionVStack>
    )
  }

  if (!challenge) {
    return (
      <MotionVStack renderInnerStack={false} gap="6">
        <Card.Root variant="subtle" p={{ base: "5", md: "8" }} w="full">
          <Heading size="md">{t("Challenge not found")}</Heading>
        </Card.Root>
      </MotionVStack>
    )
  }

  return (
    <MotionVStack renderInnerStack={false} gap="6">
      <VStack align="stretch" w="full" gap="4">
        <Button asChild w="max-content" variant="plain">
          <NextLink href="/challenges/all">
            <Icon as={FaAngleLeft} boxSize={3} />
            <Text color="inherit" textStyle="sm" fontWeight="semibold">
              {t("Back to challenges")}
            </Text>
          </NextLink>
        </Button>

        <Card.Root variant="subtle" p={{ base: "4", md: "6" }} gap="5">
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
              <Heading size="lg">{t("Challenge #{{id}}", { id: challenge.challengeId })}</Heading>
              <Text color="text.subtle" textStyle="sm">
                {t("Created by")} {humanAddress(challenge.creator, 6, 4)}
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 2, md: 4 }} gap="3">
              <VStack align="start" gap="0">
                <Text textStyle="xs" color="text.subtle">
                  {t("Prize")}
                </Text>
                <Text fontWeight="semibold">
                  {challenge.totalPrize} {"B3TR"}
                </Text>
              </VStack>
              <VStack align="start" gap="0">
                <Text textStyle="xs" color="text.subtle">
                  {t("Stake")}
                </Text>
                <Text fontWeight="semibold">
                  {challenge.stakeAmount} {"B3TR"}
                </Text>
              </VStack>
              <VStack align="start" gap="0">
                <Text textStyle="xs" color="text.subtle">
                  {t("Rounds")}
                </Text>
                <Text fontWeight="semibold">
                  {challenge.startRound}
                  {"-"}
                  {challenge.endRound}
                </Text>
              </VStack>
              <VStack align="start" gap="0">
                <Text textStyle="xs" color="text.subtle">
                  {t("Threshold")}
                </Text>
                <Text fontWeight="semibold">{challenge.threshold === "0" ? t("None") : challenge.threshold}</Text>
              </VStack>
            </SimpleGrid>

            <VStack align="stretch" gap="2">
              <Text textStyle="sm" color="text.subtle">
                {t("Selected apps")}
              </Text>
              <HStack flexWrap="wrap" gap="2">
                {challenge.allApps ? (
                  <Badge variant="subtle" rounded="sm">
                    {t("All apps")}
                  </Badge>
                ) : (
                  challenge.selectedApps.map(app => (
                    <Badge key={app} variant="subtle" rounded="sm">
                      {appNames.get(app.toLowerCase()) ?? humanAddress(app, 6, 4)}
                    </Badge>
                  ))
                )}
              </HStack>
            </VStack>

            <VStack align="stretch" gap="2">
              <Text textStyle="sm" color="text.subtle">
                {t("Participants")}
              </Text>
              <HStack flexWrap="wrap" gap="2">
                {challenge.participants.length > 0 ? (
                  challenge.participants.map(address => (
                    <Badge key={address} variant="subtle" rounded="sm">
                      {humanAddress(address, 6, 4)}
                    </Badge>
                  ))
                ) : (
                  <Text textStyle="sm" color="text.subtle">
                    {t("None yet")}
                  </Text>
                )}
              </HStack>
            </VStack>

            {challenge.invited.length > 0 && (
              <VStack align="stretch" gap="2">
                <Text textStyle="sm" color="text.subtle">
                  {t("Invited wallets")}
                </Text>
                <HStack flexWrap="wrap" gap="2">
                  {challenge.invited.map(address => (
                    <Badge key={address} variant="subtle" rounded="sm">
                      {humanAddress(address, 6, 4)}
                    </Badge>
                  ))}
                </HStack>
              </VStack>
            )}

            <ChallengeActions challenge={challenge} />
          </VStack>
        </Card.Root>
      </VStack>
    </MotionVStack>
  )
}
