"use client"

import { Box, Button, Card, Heading, HStack, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { A11y, Navigation } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import { ChallengeKind } from "@/api/challenges/types"
import { useChallengesHub } from "@/api/challenges/useChallengesHub"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { MotionVStack } from "@/components/MotionVStack"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import "swiper/css"

import { ChallengeCard } from "./ChallengeCard"
import { ChallengeCompactCard } from "./ChallengeCompactCard"
import { ChallengeHubSection } from "./ChallengeHubSection"
import { CreateChallengeModal } from "./CreateChallengeModal"

const CardSkeleton = () => (
  <Card.Root variant="primary" p="6" borderRadius="3xl" boxShadow="sm">
    <Skeleton h="220px" borderRadius="2xl" />
  </Card.Root>
)

const CompactSkeleton = () => (
  <Card.Root variant="primary" px="5" py="4" borderRadius="2xl">
    <Skeleton h="48px" borderRadius="lg" />
  </Card.Root>
)

const EmptyState = ({ message }: { message: string }) => {
  return (
    <Box bg="bg.secondary" borderRadius="2xl" px={{ base: "5", md: "6" }} py={{ base: "6", md: "8" }}>
      <Text textStyle="sm" color="text.subtle">
        {message}
      </Text>
    </Box>
  )
}

export const ChallengesPageContent = () => {
  const { account } = useWallet()
  const viewerAddress = account?.address
  const { data: grouped, isLoading } = useChallengesHub(viewerAddress)
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { t } = useTranslation()
  const round = Number(currentRoundId ?? 0)

  useEffect(() => {
    AnalyticsUtils.trackPage("Challenges")
  }, [])

  const hasActive = grouped.activeParticipating.length > 0
  const hasInvites = grouped.pendingInvites.length > 0
  const hasPublic = grouped.publicJoinable.length > 0
  const hasPast = grouped.past.length > 0

  return (
    <MotionVStack renderInnerStack={false} gap="6">
      <VStack align="stretch" w="full" gap="8">
        {/* Header */}
        <Stack direction={{ base: "column", md: "row" }} justify="space-between" align={{ md: "center" }} gap="4">
          <VStack align="start" gap="1">
            <Heading size="xl">{t("Challenges")}</Heading>
            <Text color="text.subtle" textStyle="sm">
              {t("Challenges description")}
            </Text>
          </VStack>
          <HStack gap="2" flexShrink={0}>
            <CreateChallengeModal defaultKind={ChallengeKind.Stake} currentRound={round}>
              <Button variant="primary" size="sm">
                {t("Create stake challenge")}
              </Button>
            </CreateChallengeModal>
            <CreateChallengeModal defaultKind={ChallengeKind.Sponsored} currentRound={round}>
              <Button variant="secondary" size="sm">
                {t("Create sponsored challenge")}
              </Button>
            </CreateChallengeModal>
          </HStack>
        </Stack>

        {/* Active participating - horizontal carousel */}
        {(hasActive || isLoading) && (
          <ChallengeHubSection title={t("Your active challenges")} count={grouped.activeParticipating.length}>
            {isLoading ? (
              <HStack gap="4">
                {[0, 1].map(i => (
                  <Box key={i} minW={{ base: "85vw", md: "420px" }}>
                    <CardSkeleton />
                  </Box>
                ))}
              </HStack>
            ) : (
              <Box mx={{ base: "-4", md: "0" }}>
                <Swiper
                  modules={[A11y, Navigation]}
                  spaceBetween={16}
                  slidesPerView={1.15}
                  style={{ paddingLeft: "16px", paddingRight: "16px" }}
                  breakpoints={{
                    768: { slidesPerView: 1.5, spaceBetween: 16 },
                    1024: { slidesPerView: 2.2, spaceBetween: 20 },
                  }}>
                  {grouped.activeParticipating.map(c => (
                    <SwiperSlide key={c.challengeId} style={{ height: "auto" }}>
                      <ChallengeCard challenge={c} currentRound={round} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </Box>
            )}
          </ChallengeHubSection>
        )}

        {/* Pending invites - horizontal carousel */}
        {(hasInvites || (isLoading && viewerAddress)) && (
          <ChallengeHubSection title={t("Pending invitations")} count={grouped.pendingInvites.length}>
            {isLoading ? (
              <HStack gap="4">
                <Box minW={{ base: "85vw", md: "420px" }}>
                  <CardSkeleton />
                </Box>
              </HStack>
            ) : (
              <Box mx={{ base: "-4", md: "0" }}>
                <Swiper
                  modules={[A11y, Navigation]}
                  spaceBetween={16}
                  slidesPerView={1.15}
                  style={{ paddingLeft: "16px", paddingRight: "16px" }}
                  breakpoints={{
                    768: { slidesPerView: 1.5, spaceBetween: 16 },
                    1024: { slidesPerView: 2.2, spaceBetween: 20 },
                  }}>
                  {grouped.pendingInvites.map(c => (
                    <SwiperSlide key={c.challengeId} style={{ height: "auto" }}>
                      <ChallengeCard challenge={c} currentRound={round} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </Box>
            )}
          </ChallengeHubSection>
        )}

        {/* Public joinable - compact list */}
        <ChallengeHubSection title={t("Open to join")} count={grouped.publicJoinable.length}>
          {isLoading ? (
            <VStack gap="2" align="stretch">
              {[0, 1, 2].map(i => (
                <CompactSkeleton key={i} />
              ))}
            </VStack>
          ) : hasPublic ? (
            <VStack gap="2" align="stretch">
              {grouped.publicJoinable.map(c => (
                <ChallengeCompactCard key={c.challengeId} challenge={c} />
              ))}
            </VStack>
          ) : (
            <EmptyState message={t("No public challenges available right now")} />
          )}
        </ChallengeHubSection>

        {/* Past / completed */}
        {(hasPast || isLoading) && (
          <ChallengeHubSection title={t("History")} count={grouped.past.length}>
            {isLoading ? (
              <VStack gap="2" align="stretch">
                {[0, 1].map(i => (
                  <CompactSkeleton key={i} />
                ))}
              </VStack>
            ) : (
              <VStack gap="2" align="stretch">
                {grouped.past.map(c => (
                  <ChallengeCompactCard key={c.challengeId} challenge={c} />
                ))}
              </VStack>
            )}
          </ChallengeHubSection>
        )}
      </VStack>
    </MotionVStack>
  )
}
