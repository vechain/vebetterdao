import { Button, Card, Grid, Heading, HStack, Skeleton, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import NextLink from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { useChallengeDetail } from "@/api/challenges/useChallengeDetail"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"

import { ChallengeActivityCard } from "./ChallengeActivityCard"
import { ChallengeHeaderCard } from "./ChallengeHeaderCard"
import { ChallengeParticipantsCard } from "./ChallengeParticipantsCard"
import { ChallengeRoleBanner } from "./ChallengeRoleBanner"
import { ChallengeStatsGrid } from "./ChallengeStatsGrid"

export const ChallengeDetailPageContent = ({ challengeId }: { challengeId: string }) => {
  const { account } = useWallet()
  const viewerAddress = account?.address
  const searchParams = useSearchParams()
  const router = useRouter()
  const isFresh = searchParams.get("fresh") === "1"
  const { data: challenge, isLoading } = useChallengeDetail(challengeId, viewerAddress, {
    pollWhileMissing: isFresh,
  })
  const { t } = useTranslation()

  useEffect(() => {
    if (isFresh && challenge) {
      router.replace(`/challenges/${challengeId}`)
    }
  }, [isFresh, challenge, challengeId, router])

  if (isLoading) {
    return <ChallengeDetailSkeleton />
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
      <VStack hideFrom="md" gap={{ base: 2, md: 3 }} align="stretch">
        <ChallengeParticipantsCard challenge={challenge} />
        <ChallengeActivityCard challenge={challenge} />
      </VStack>

      {/* Desktop: 2-column grid */}
      <Grid hideBelow="md" gridTemplateColumns="repeat(2,1fr)" gap={{ base: 2, md: 3 }}>
        <ChallengeActivityCard challenge={challenge} />
        <ChallengeParticipantsCard challenge={challenge} />
      </Grid>
    </VStack>
  )
}

const ChallengeDetailSkeleton = () => {
  return (
    <VStack align="stretch" w="full" gap="5">
      <Skeleton h="5" w="32" borderRadius="md" />

      <Card.Root variant="primary" p="4" w="full">
        <VStack align="stretch" gap="4">
          <HStack justify="space-between" align="start">
            <VStack gap="2" align="start">
              <HStack gap="1.5">
                <Skeleton h="5" w="16" borderRadius="full" />
                <Skeleton h="5" w="24" borderRadius="full" />
              </HStack>
              <Skeleton h="5" w="20" borderRadius="full" />
            </VStack>
            <Skeleton boxSize="8" borderRadius="md" />
          </HStack>
          <Skeleton h={{ base: "8", md: "10" }} w="80%" borderRadius="md" />
          <VStack align="stretch" gap="2">
            <Skeleton h="3" w="full" borderRadius="md" />
            <Skeleton h="3" w="90%" borderRadius="md" />
            <Skeleton h="3" w="60%" borderRadius="md" />
          </VStack>
        </VStack>
      </Card.Root>

      <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }} gap={{ base: 2, md: 3 }} w="full">
        {["prize", "rule", "duration", "apps"].map(key => (
          <Skeleton key={key} h={{ base: "20", md: "28" }} borderRadius="lg" />
        ))}
      </Grid>

      <VStack hideFrom="md" gap="5" align="stretch">
        <Skeleton h="500px" borderRadius="2xl" />
        <Skeleton h="500px" borderRadius="2xl" />
      </VStack>

      <Grid hideBelow="md" gridTemplateColumns="repeat(2,1fr)" gap="6">
        <Skeleton h="500px" borderRadius="2xl" />
        <Skeleton h="500px" borderRadius="2xl" />
      </Grid>
    </VStack>
  )
}
