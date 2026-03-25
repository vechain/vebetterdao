"use client"

import { Button, Card, Heading, SimpleGrid, Skeleton, Stack, Tabs, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { ChallengeKind, ChallengeTab } from "@/api/challenges/types"
import { useChallenges } from "@/api/challenges/useChallenges"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { MotionVStack } from "@/components/MotionVStack"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import { ChallengeCard } from "./ChallengeCard"
import { ChallengeTabs } from "./ChallengeTabs"
import { CreateChallengeModal } from "./CreateChallengeModal"
import { PendingInvitationsBanner } from "./PendingInvitationsBanner"

export const ChallengesPageContent = ({ tab }: { tab: ChallengeTab }) => {
  const { account } = useWallet()
  const viewerAddress = account?.address
  const { data: challenges = [], isLoading } = useChallenges(tab, viewerAddress)
  const { data: allChallenges = [] } = useChallenges("all", viewerAddress)
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { t } = useTranslation()

  useEffect(() => {
    AnalyticsUtils.trackPage("Challenges")
  }, [])

  const pendingInvitationCount = allChallenges.filter(c => c.isInvitationPending).length
  const round = Number(currentRoundId ?? 0)

  return (
    <MotionVStack renderInnerStack={false} gap="6">
      <VStack align="stretch" w="full" gap="4">
        <Stack direction={{ base: "column", md: "row" }} justify="space-between" gap="4">
          <VStack align="start" gap="1">
            <Heading size="xl">{t("Challenges")}</Heading>
            <Text color="text.subtle" textStyle="sm">
              {t("Challenges description")}
            </Text>
          </VStack>

          <Stack direction={{ base: "column", sm: "row" }} gap="2">
            <CreateChallengeModal defaultKind={ChallengeKind.Stake} currentRound={round}>
              <Button variant="solid">{t("Create stake challenge")}</Button>
            </CreateChallengeModal>
            <CreateChallengeModal defaultKind={ChallengeKind.Sponsored} currentRound={round}>
              <Button variant="ghost">{t("Create sponsored challenge")}</Button>
            </CreateChallengeModal>
          </Stack>
        </Stack>

        <PendingInvitationsBanner count={pendingInvitationCount} />

        <ChallengeTabs currentTab={tab}>
          <Tabs.Content value={tab}>
            {isLoading ? (
              <SimpleGrid columns={{ base: 1, xl: 2 }} gap="4">
                {[0, 1, 2].map(index => (
                  <Card.Root key={index} p="6">
                    <Skeleton h="220px" />
                  </Card.Root>
                ))}
              </SimpleGrid>
            ) : challenges.length === 0 ? (
              <Card.Root variant="subtle" p={{ base: "5", md: "8" }} w="full">
                <VStack align="start" gap="2">
                  <Heading size="md">{t("No challenges found")}</Heading>
                  <Text color="text.subtle" textStyle="sm">
                    {t("No challenges found description")}
                  </Text>
                </VStack>
              </Card.Root>
            ) : (
              <SimpleGrid columns={{ base: 1, xl: 2 }} gap="4">
                {challenges.map(challenge => (
                  <ChallengeCard key={challenge.challengeId} challenge={challenge} />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Content>
        </ChallengeTabs>
      </VStack>
    </MotionVStack>
  )
}
