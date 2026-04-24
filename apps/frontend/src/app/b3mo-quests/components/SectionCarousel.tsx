import { Box, Heading, HStack, IconButton, VStack } from "@chakra-ui/react"
import { useCallback, useId } from "react"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"
import { A11y, Navigation } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import { ChallengeView } from "@/api/challenges/types"
import { ChallengeSectionResult } from "@/api/challenges/useChallengeSections"

import "@/app/theme/swiper-custom.css"
import "swiper/css"
import "swiper/css/navigation"

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
  640: { slidesPerView: 2.2, spaceBetween: 14 },
  960: { slidesPerView: 3.2, spaceBetween: 16 },
  1200: { slidesPerView: 3.6, spaceBetween: 16 },
}

const SKELETON_SLIDES = 1
const INITIAL_SKELETON_SLIDES = 3

export const SectionCarousel = ({ title, section, items, hideWhenEmpty = true }: SectionCarouselProps) => {
  const displayItems = items ?? section.items
  const uid = useId().replace(/:/g, "")
  const prevClass = `swiper-prev-${uid}`
  const nextClass = `swiper-next-${uid}`

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
      <Box position="relative" w="full">
        <Swiper
          modules={[A11y, Navigation]}
          breakpoints={BREAKPOINTS}
          onReachEnd={handleReachEnd}
          navigation={{ prevEl: `.${prevClass}`, nextEl: `.${nextClass}` }}
          style={{ width: "100%" }}>
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

        <IconButton
          hideBelow="md"
          className={prevClass}
          aria-label="Previous"
          rounded="full"
          size="md"
          position="absolute"
          zIndex={2}
          top="50%"
          left={{ md: "-70px" }}
          transform="translateY(-50%)"
          _disabled={{ opacity: 0.4, cursor: "not-allowed" }}>
          <FaArrowLeft />
        </IconButton>
        <IconButton
          hideBelow="md"
          className={nextClass}
          aria-label="Next"
          rounded="full"
          size="md"
          position="absolute"
          zIndex={2}
          top="50%"
          right={{ md: "-70px" }}
          transform="translateY(-50%)"
          _disabled={{ opacity: 0.4, cursor: "not-allowed" }}>
          <FaArrowRight />
        </IconButton>
      </Box>
    </VStack>
  )
}
