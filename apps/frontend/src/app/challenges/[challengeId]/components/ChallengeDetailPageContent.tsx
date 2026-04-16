import { Button, Card, Grid, Heading, Skeleton, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { useChallenge } from "@/api/challenges/useChallenge"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"

import { ChallengeActivityCard } from "./ChallengeActivityCard"
import { ChallengeAppsCard } from "./ChallengeAppsCard"
import { ChallengeRoleBanner } from "./ChallengeRoleBanner"
import { ChallengeStatsGrid } from "./ChallengeStatsGrid"
import { ChallengeHeaderCard } from "./ChallengeSummaryCard"

export const ChallengeDetailPageContent = ({ challengeId }: { challengeId: string }) => {
  const { account } = useWallet()
  const viewerAddress = account?.address
  const { data: challenge, isLoading } = useChallenge(challengeId, viewerAddress)
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Card.Root variant="primary" p={{ base: "6", md: "8" }} w="full" borderRadius="3xl" boxShadow="sm">
        <Skeleton h="360px" borderRadius="2xl" />
      </Card.Root>
    )
  }

  if (!challenge) {
    return (
      <Card.Root variant="primary" p={{ base: "6", md: "8" }} w="full" borderRadius="3xl" boxShadow="sm">
        <VStack gap="3" py="8">
          <Heading size="md">{t("Quest not found")}</Heading>
          <Button asChild variant="secondary" size="sm">
            <NextLink href="/challenges">{t("Back to quests")}</NextLink>
          </Button>
        </VStack>
      </Card.Root>
    )
  }

  const breadcrumbItems = [
    { label: t("Quests"), href: "/challenges" },
    { label: t("#{{id}}", { id: challenge.challengeId }), href: `/challenges/${challengeId}` },
  ]

  return (
    <VStack align="stretch" w="full" gap="5">
      <PageBreadcrumb items={breadcrumbItems} />

      <ChallengeRoleBanner challenge={challenge} />

      <ChallengeHeaderCard challenge={challenge} />

      <ChallengeStatsGrid challenge={challenge} />

      {/* Mobile: stacked */}
      <VStack hideFrom="md" gap="5" align="stretch">
        <ChallengeActivityCard />
        <ChallengeAppsCard challenge={challenge} />
      </VStack>

      {/* Desktop: 2-column grid */}
      <Grid hideBelow="md" gridTemplateColumns="repeat(2,1fr)" gap="6">
        <ChallengeActivityCard />
        <ChallengeAppsCard challenge={challenge} />
      </Grid>
    </VStack>
  )
}
