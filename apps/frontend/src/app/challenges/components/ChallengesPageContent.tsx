"use client"

import {
  Box,
  Button,
  Card,
  Heading,
  HStack,
  Icon,
  IconButton,
  Link,
  SimpleGrid,
  Skeleton,
  Stack,
  VStack,
  Wrap,
} from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"
import { A11y, Navigation } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import { ChallengeKind, ChallengeView } from "@/api/challenges/types"
import { useChallengesHub } from "@/api/challenges/useChallengesHub"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { MotionVStack } from "@/components/MotionVStack"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import "swiper/css"
import "swiper/css/navigation"

import { ChallengeCard } from "./ChallengeCard"
import { ChallengeCompactCard } from "./ChallengeCompactCard"
import { ChallengeHubSection } from "./ChallengeHubSection"
import { ChallengeStepsCard } from "./ChallengeStepsCard"
import { CreateChallengeModal } from "./CreateChallengeModal"

const QUESTS_STEPS_CARD_DISMISSED_KEY = "vebetterdao:quests-steps-card-dismissed"

const CardSkeleton = () => (
  <Card.Root variant="primary" p={{ base: "6", md: "7" }} gap="5" h="full" borderRadius="3xl" boxShadow="sm">
    <VStack align="stretch" gap="6" h="full">
      <VStack align="stretch" gap="4">
        <Wrap gap="2">
          <Skeleton h="6" w="16" borderRadius="full" />
          <Skeleton h="6" w="20" borderRadius="full" />
        </Wrap>
        <VStack align="stretch" gap="2">
          <Skeleton h="7" w="72%" borderRadius="md" />
          <Skeleton h="7" w="48%" borderRadius="md" />
        </VStack>
        <Wrap gap="2">
          <Skeleton h="7" w="28" borderRadius="full" />
          <Skeleton h="7" w="24" borderRadius="full" />
          <Skeleton h="7" w="24" borderRadius="full" />
        </Wrap>
      </VStack>

      <SimpleGrid columns={2} gap="3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} h="24" borderRadius="2xl" />
        ))}
      </SimpleGrid>

      <Box mt="auto">
        <Skeleton h="20" borderRadius="2xl" />
      </Box>
    </VStack>
  </Card.Root>
)

const CompactSkeleton = () => (
  <Card.Root
    variant="primary"
    px={{ base: "5", md: "6" }}
    py={{ base: "5", md: "6" }}
    borderRadius="3xl"
    h="full"
    boxShadow="sm">
    <VStack gap={{ base: "5", md: "6" }} align="stretch" h="full">
      <Stack
        direction={{ base: "column", md: "row" }}
        justify="space-between"
        align={{ base: "stretch", md: "start" }}
        gap="4">
        <VStack align="stretch" gap="3" flex="1" minW="0">
          <Wrap gap="2">
            <Skeleton h="6" w="14" borderRadius="full" />
            <Skeleton h="6" w="18" borderRadius="full" />
          </Wrap>
          <VStack align="stretch" gap="2">
            <Skeleton h="7" w="68%" borderRadius="md" />
            <Skeleton h="7" w="42%" borderRadius="md" />
          </VStack>
          <Wrap gap="2">
            <Skeleton h="7" w="24" borderRadius="full" />
            <Skeleton h="7" w="22" borderRadius="full" />
            <Skeleton h="7" w="22" borderRadius="full" />
          </Wrap>
        </VStack>
        <Skeleton h="10" w={{ base: "full", md: "28" }} borderRadius="full" />
      </Stack>

      <SimpleGrid columns={2} gap="3" mt="auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} h="24" borderRadius="2xl" />
        ))}
      </SimpleGrid>

      <Wrap gap="2">
        <Skeleton h="6" w="28" borderRadius="full" />
        <Skeleton h="6" w="32" borderRadius="full" />
      </Wrap>
    </VStack>
  </Card.Root>
)

type CompactChallengeCarouselProps = {
  navigationId: string
  items: ChallengeView[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<unknown>
}

const CompactChallengeCarousel = ({
  navigationId,
  items,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: CompactChallengeCarouselProps) => {
  const handleReachEnd = () => {
    if (!hasNextPage || isFetchingNextPage) return
    void fetchNextPage()
  }

  return (
    <Box position="relative" mx={{ base: "-4", md: "0" }}>
      <Swiper
        modules={[A11y, Navigation]}
        spaceBetween={12}
        slidesPerView={1.08}
        style={{ padding: "4px 16px 16px" }}
        navigation={{
          nextEl: `.${navigationId}-swiper-next`,
          prevEl: `.${navigationId}-swiper-prev`,
        }}
        onReachEnd={handleReachEnd}
        breakpoints={{
          768: { slidesPerView: 1.6, spaceBetween: 16 },
          1024: { slidesPerView: 2.25, spaceBetween: 16 },
          1280: { slidesPerView: 2.8, spaceBetween: 16 },
        }}>
        {items.map(c => (
          <SwiperSlide key={c.challengeId} style={{ height: "auto" }}>
            <ChallengeCompactCard challenge={c} />
          </SwiperSlide>
        ))}
        {isFetchingNextPage && (
          <SwiperSlide key={`${navigationId}-loading`} style={{ height: "auto" }}>
            <CompactSkeleton />
          </SwiperSlide>
        )}
      </Swiper>
      <IconButton
        hideBelow="md"
        className={`${navigationId}-swiper-prev`}
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
        className={`${navigationId}-swiper-next`}
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
    </Box>
  )
}

export const ChallengesPageContent = () => {
  const { account } = useWallet()
  const viewerAddress = account?.address
  const { data: grouped, isLoading } = useChallengesHub(viewerAddress)
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  /** null = before first client read of localStorage */
  const [stepsOpen, setStepsOpen] = useState<boolean | null>(null)
  const open = stepsOpen !== null ? stepsOpen : !isMobile

  const onOpen = useCallback(() => setStepsOpen(true), [])
  const onClose = useCallback(() => {
    setStepsOpen(false)
    try {
      localStorage.setItem(QUESTS_STEPS_CARD_DISMISSED_KEY, "1")
    } catch {
      // ignore quota / private mode
    }
  }, [])

  const round = Number(currentRoundId ?? 0)

  useEffect(() => {
    AnalyticsUtils.trackPage("Challenges")
  }, [])

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(QUESTS_STEPS_CARD_DISMISSED_KEY) === "1"
    } catch {
      // ignore
    }
    if (dismissed) {
      setStepsOpen(false)
    } else {
      setStepsOpen(!isMobile)
    }
  }, [isMobile])

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
          <HStack alignItems="center" textAlign="center" justifyContent="flex-start">
            <Heading size={{ base: "2xl", lg: "3xl" }}>{t("Quests")}</Heading>
            {!open && (
              <Link
                display="inline-flex"
                alignItems="center"
                fontWeight={500}
                color="primary.500"
                px={0}
                textStyle={{ base: "xs", lg: "md" }}
                onClick={onOpen}>
                <Icon as={UilInfoCircle} boxSize={4} />
                {!isMobile && t("More info")}
              </Link>
            )}
          </HStack>
          <CreateChallengeModal defaultKind={ChallengeKind.Stake} currentRound={round}>
            <Button variant="primary" size="sm">
              {t("Create Quest")}
            </Button>
          </CreateChallengeModal>
        </Stack>

        <ChallengeStepsCard isOpen={open} onClose={onClose} />

        {/* Needed actions */}
        {(hasNeededActions || (isLoading && viewerAddress)) && (
          <ChallengeHubSection title={t("Needed actions")}>
            {grouped.neededActions.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                {[0, 1].map(i => (
                  <CompactSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : (
              <CompactChallengeCarousel
                navigationId="needed-actions"
                items={grouped.neededActions.items}
                hasNextPage={grouped.neededActions.hasNextPage}
                isFetchingNextPage={grouped.neededActions.isFetchingNextPage}
                fetchNextPage={grouped.neededActions.fetchNextPage}
              />
            )}
          </ChallengeHubSection>
        )}

        {/* Active participating - horizontal carousel */}
        {(hasActive || isLoading) && (
          <ChallengeHubSection title={t("Your active challenges")}>
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
                  onReachEnd={() => {
                    if (!grouped.active.hasNextPage || grouped.active.isFetchingNextPage) return
                    void grouped.active.fetchNextPage()
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
                  {grouped.active.isFetchingNextPage && (
                    <SwiperSlide key="active-loading" style={{ height: "auto" }}>
                      <CardSkeleton />
                    </SwiperSlide>
                  )}
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
              </Box>
            )}
          </ChallengeHubSection>
        )}

        {/* Open challenges */}
        {(hasOpen || isLoading) && (
          <ChallengeHubSection title={t("Open to join")}>
            {grouped.open.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                {[0, 1, 2].map(i => (
                  <CompactSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : (
              <CompactChallengeCarousel
                navigationId="open"
                items={grouped.open.items}
                hasNextPage={grouped.open.hasNextPage}
                isFetchingNextPage={grouped.open.isFetchingNextPage}
                fetchNextPage={grouped.open.fetchNextPage}
              />
            )}
          </ChallengeHubSection>
        )}

        {/* Explore active challenges */}
        {(hasExplore || isLoading) && (
          <ChallengeHubSection title={t("What others are doing")}>
            {grouped.explore.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                {[0, 1, 2].map(i => (
                  <CompactSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : (
              <CompactChallengeCarousel
                navigationId="explore"
                items={grouped.explore.items}
                hasNextPage={grouped.explore.hasNextPage}
                isFetchingNextPage={grouped.explore.isFetchingNextPage}
                fetchNextPage={grouped.explore.fetchNextPage}
              />
            )}
          </ChallengeHubSection>
        )}

        {/* History */}
        {(hasHistory || (isLoading && viewerAddress)) && (
          <ChallengeHubSection title={t("History")}>
            {grouped.history.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="3">
                {[0, 1].map(i => (
                  <CompactSkeleton key={i} />
                ))}
              </SimpleGrid>
            ) : (
              <CompactChallengeCarousel
                navigationId="history"
                items={grouped.history.items}
                hasNextPage={grouped.history.hasNextPage}
                isFetchingNextPage={grouped.history.isFetchingNextPage}
                fetchNextPage={grouped.history.fetchNextPage}
              />
            )}
          </ChallengeHubSection>
        )}
      </VStack>
    </MotionVStack>
  )
}
