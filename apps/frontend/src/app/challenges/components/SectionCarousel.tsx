import { Box, Heading, HStack, VStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { A11y } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import { ChallengeView } from "@/api/challenges/types"
import { ChallengeSectionResult } from "@/api/challenges/useChallengeSections"

import "@/app/theme/swiper-custom.css"
import "swiper/css"

import { ChallengeCard } from "./ChallengeCard"
import { CompactSkeleton } from "./CompactSkeleton"

interface SectionCarouselProps {
  title: string
  section: ChallengeSectionResult
  /** Override for section.items (e.g. after cross-section dedup). Falls back to section.items. */
  items?: ChallengeView[]
  hideWhenEmpty?: boolean
}

const BREAKPOINTS = {
  0: { slidesPerView: 1.1, spaceBetween: 12 },
  640: { slidesPerView: 1.6, spaceBetween: 14 },
  960: { slidesPerView: 2.2, spaceBetween: 16 },
  1200: { slidesPerView: 2.6, spaceBetween: 16 },
}

const SKELETON_SLIDES = 2
const INITIAL_SKELETON_SLIDES = 3

export const SectionCarousel = ({ title, section, items, hideWhenEmpty = true }: SectionCarouselProps) => {
  const displayItems = items ?? section.items

  const handleReachEnd = useCallback(() => {
    if (section.hasNextPage && !section.isFetchingNextPage) {
      void section.fetchNextPage()
    }
  }, [section])

  if (section.isLoading) {
    return (
      <VStack align="stretch" gap="3" w="full">
        <Heading textStyle={{ base: "lg", md: "xl" }}>{title}</Heading>
        <Swiper modules={[A11y]} breakpoints={BREAKPOINTS} style={{ width: "100%" }}>
          {Array.from({ length: INITIAL_SKELETON_SLIDES }).map((_, i) => (
            <SwiperSlide key={`initial-skel-${i}`} style={{ height: "auto" }}>
              <Box h="full">
                <CompactSkeleton />
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </VStack>
    )
  }

  if (displayItems.length === 0 && hideWhenEmpty) {
    return null
  }

  return (
    <VStack align="stretch" gap="3" w="full">
      <HStack justify="space-between" align="center">
        <Heading textStyle={{ base: "lg", md: "xl" }}>{title}</Heading>
      </HStack>
      <Swiper modules={[A11y]} breakpoints={BREAKPOINTS} onReachEnd={handleReachEnd} style={{ width: "100%" }}>
        {displayItems.map(challenge => (
          <SwiperSlide key={challenge.challengeId} style={{ height: "auto" }}>
            <Box h="full">
              <ChallengeCard challenge={challenge} />
            </Box>
          </SwiperSlide>
        ))}
        {section.isFetchingNextPage &&
          Array.from({ length: SKELETON_SLIDES }).map((_, i) => (
            <SwiperSlide key={`skel-${i}`} style={{ height: "auto" }}>
              <Box h="full">
                <CompactSkeleton />
              </Box>
            </SwiperSlide>
          ))}
      </Swiper>
    </VStack>
  )
}
