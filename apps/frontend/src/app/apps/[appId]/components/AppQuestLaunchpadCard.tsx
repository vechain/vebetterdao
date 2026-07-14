import { Button, Card, Heading, HStack, Icon, List, Stack, Text, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LuCircleCheck, LuRocket } from "react-icons/lu"

import { ChallengeKind } from "@/api/challenges/types"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { CreateChallengeModal } from "@/app/b3mo-quests/components/CreateChallengeModal"
import { QuestParticipationGuide } from "@/app/b3mo-quests/components/QuestParticipationGuide"

const readinessChecks = [
  "Every eligible action includes the time it happened.",
  "Your app clearly states how often users can claim rewards.",
  "Eligibility rules are transparent and available to everyone.",
  "Eligibility does not depend on insider-only information.",
] as const

export const AppQuestLaunchpadCard = () => {
  const { t } = useTranslation()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const [isGuideOpen, setIsGuideOpen] = useState(false)

  return (
    <Card.Root w="full" variant="primary" data-testid="app-quest-launchpad-card">
      <Card.Body>
        <Stack
          direction={{ base: "column", lg: "row" }}
          align={{ base: "stretch", lg: "center" }}
          justify="space-between"
          gap={{ base: "6", lg: "10" }}>
          <VStack align="stretch" gap="4" flex="1">
            <HStack gap="3" align="center">
              <Icon color="brand.primary" boxSize="6">
                <LuRocket />
              </Icon>
              <Heading size="xl">
                {t("Grow your app with B3MO Quests", { defaultValue: "Grow your app with B3MO Quests" })}
              </Heading>
            </HStack>

            <Text color="text.subtle">
              {t("Sponsor a Quest to help users discover your app and reward meaningful actions.", {
                defaultValue: "Sponsor a Quest to help users discover your app and reward meaningful actions.",
              })}
            </Text>

            <VStack align="stretch" gap="2">
              <Text fontWeight="semibold">
                {t("Before creating a sponsored Quest, make sure:", {
                  defaultValue: "Before creating a sponsored Quest, make sure:",
                })}
              </Text>
              <List.Root gap="2" variant="plain">
                {readinessChecks.map(check => (
                  <List.Item key={check} alignItems="flex-start">
                    <List.Indicator asChild color="status.positive.primary" mt="0.5">
                      <LuCircleCheck />
                    </List.Indicator>
                    {t(check, { defaultValue: check })}
                  </List.Item>
                ))}
              </List.Root>
            </VStack>
          </VStack>

          <VStack align="stretch" gap="3" flexShrink={0}>
            <CreateChallengeModal defaultKind={ChallengeKind.Sponsored} currentRound={Number(currentRoundId ?? 0)}>
              <Button variant="primary" minH="11" w={{ base: "full", lg: "auto" }} data-cy="create-sponsored-quest">
                {t("Create sponsored B3MO quest")}
              </Button>
            </CreateChallengeModal>
            <Button
              variant="secondary"
              minH="11"
              w={{ base: "full", lg: "auto" }}
              data-cy="app-quest-participation-guide"
              onClick={() => setIsGuideOpen(true)}>
              {t("How Quests work")}
            </Button>
          </VStack>
        </Stack>
      </Card.Body>
      <QuestParticipationGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </Card.Root>
  )
}
