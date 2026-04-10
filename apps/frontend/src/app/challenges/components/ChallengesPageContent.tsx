"use client"

import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  IconButton,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"
import { A11y, Navigation } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import { ChallengeKind } from "@/api/challenges/types"
import { useChallengesHub } from "@/api/challenges/useChallengesHub"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { MotionVStack } from "@/components/MotionVStack"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import "swiper/css"
import "swiper/css/navigation"

import { ChallengeCard } from "./ChallengeCard"
import { ChallengeCompactCard } from "./ChallengeCompactCard"
import { ChallengeHubSection } from "./ChallengeHubSection"
import { CreateChallengeModal } from "./CreateChallengeModal"

const CardSkeleton = () => (
  <Card.Root variant="primary" p="6" borderRadius="3xl" boxShadow="sm">
    <Skeleton h="360px" borderRadius="2xl" />
  </Card.Root>
)

const CompactSkeleton = () => (
  <Card.Root variant="primary" px="5" py="5" borderRadius="3xl">
    <Skeleton h="220px" borderRadius="2xl" />
  </Card.Root>
)

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

  const hasNeededActions = grouped.neededActions.items.length > 0
  const hasActive = grouped.active.items.length > 0
  const hasOpen = grouped.open.items.length > 0
  const hasExplore = grouped.explore.items.length > 0
  const hasHistory = grouped.history.items.length > 0

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
                {t("Create challenge")}
              </Button>
            </CreateChallengeModal>
          </HStack>
        </Stack>

        {/* Needed actions */}
        {(hasNeededActions || (isLoading && viewerAddress)) && (
          <ChallengeHubSection title={t("Needed actions")} count={grouped.neededActions.items.length}>
            {grouped.neededActions.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                {[0, 1].map(i => (
                  <CompactSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : (
              <VStack gap="3" align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                  {grouped.neededActions.items.map(c => (
                    <ChallengeCompactCard key={c.challengeId} challenge={c} />
                  ))}
                </SimpleGrid>
                {grouped.neededActions.hasNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => grouped.neededActions.fetchNextPage()}
                    loading={grouped.neededActions.isFetchingNextPage}
                    w="full">
                    {t("Load more")}
                  </Button>
                )}
              </VStack>
            )}
          </ChallengeHubSection>
        )}

        {/* Active participating - horizontal carousel */}
        {(hasActive || isLoading) && (
          <ChallengeHubSection title={t("Your active challenges")} count={grouped.active.items.length}>
            {grouped.active.isLoading ? (
              <HStack gap="4">
                {[0, 1].map(i => (
                  <Box key={i} minW={{ base: "85vw", md: "420px" }}>
                    <CardSkeleton />
                  </Box>
                ))}
              </HStack>
            ) : (
              <Box position="relative" mx={{ base: "-4", md: "0" }}>
                <Swiper
                  modules={[A11y, Navigation]}
                  spaceBetween={16}
                  slidesPerView={1.15}
                  style={{ padding: "4px 16px 16px" }}
                  navigation={{
                    nextEl: ".active-swiper-next",
                    prevEl: ".active-swiper-prev",
                  }}
                  breakpoints={{
                    768: { slidesPerView: 1.5, spaceBetween: 16 },
                    1024: { slidesPerView: 2.2, spaceBetween: 20 },
                  }}>
                  {grouped.active.items.map(c => (
                    <SwiperSlide key={c.challengeId} style={{ height: "auto" }}>
                      <ChallengeCard challenge={c} currentRound={round} />
                    </SwiperSlide>
                  ))}
                </Swiper>
                <IconButton
                  hideBelow="md"
                  className="active-swiper-prev"
                  pos="absolute"
                  zIndex={2}
                  rounded="full"
                  variant="outline"
                  size="sm"
                  left="-12"
                  top="50%"
                  transform="translateY(-50%)"
                  aria-label="Previous challenge">
                  <FaArrowLeft />
                </IconButton>
                <IconButton
                  hideBelow="md"
                  className="active-swiper-next"
                  pos="absolute"
                  zIndex={2}
                  rounded="full"
                  variant="outline"
                  size="sm"
                  right="-12"
                  top="50%"
                  transform="translateY(-50%)"
                  aria-label="Next challenge">
                  <FaArrowRight />
                </IconButton>
                {grouped.active.hasNextPage && (
                  <Box px={{ base: "4", md: "16" }} pt="1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => grouped.active.fetchNextPage()}
                      loading={grouped.active.isFetchingNextPage}
                      w={{ base: "full", md: "auto" }}>
                      {t("Load more")}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </ChallengeHubSection>
        )}

        {/* Open challenges */}
        {(hasOpen || isLoading) && (
          <ChallengeHubSection title={t("Open to join")} count={grouped.open.items.length}>
            {grouped.open.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                {[0, 1, 2].map(i => (
                  <CompactSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : (
              <VStack gap="3" align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                  {grouped.open.items.map(c => (
                    <ChallengeCompactCard key={c.challengeId} challenge={c} />
                  ))}
                </SimpleGrid>
                {grouped.open.hasNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => grouped.open.fetchNextPage()}
                    loading={grouped.open.isFetchingNextPage}
                    w="full">
                    {t("Load more")}
                  </Button>
                )}
              </VStack>
            )}
          </ChallengeHubSection>
        )}

        {/* Explore active challenges */}
        {(hasExplore || isLoading) && (
          <ChallengeHubSection title={t("What others are doing")} count={grouped.explore.items.length}>
            {grouped.explore.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                {[0, 1, 2].map(i => (
                  <CompactSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : (
              <VStack gap="3" align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                  {grouped.explore.items.map(c => (
                    <ChallengeCompactCard key={c.challengeId} challenge={c} />
                  ))}
                </SimpleGrid>
                {grouped.explore.hasNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => grouped.explore.fetchNextPage()}
                    loading={grouped.explore.isFetchingNextPage}
                    w="full">
                    {t("Load more")}
                  </Button>
                )}
              </VStack>
            )}
          </ChallengeHubSection>
        )}

        {/* History */}
        {(hasHistory || (isLoading && viewerAddress)) && (
          <ChallengeHubSection title={t("History")} count={grouped.history.items.length}>
            {grouped.history.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                {[0, 1].map(i => (
                  <CompactSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : (
              <VStack gap="3" align="stretch">
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                  {grouped.history.items.map(c => (
                    <ChallengeCompactCard key={c.challengeId} challenge={c} />
                  ))}
                </SimpleGrid>
                {grouped.history.hasNextPage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => grouped.history.fetchNextPage()}
                    loading={grouped.history.isFetchingNextPage}
                    w="full">
                    {t("Load more")}
                  </Button>
                )}
              </VStack>
            )}
          </ChallengeHubSection>
        )}
      </VStack>
    </MotionVStack>
  )
}
