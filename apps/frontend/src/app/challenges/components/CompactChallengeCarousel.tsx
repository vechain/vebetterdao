import { Box, Card, IconButton, SimpleGrid, Skeleton, Stack, VStack, Wrap } from "@chakra-ui/react"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"
import { A11y, Navigation } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import { ChallengeView } from "@/api/challenges/types"

import { ChallengeCard } from "./ChallengeCard"

export const CompactSkeleton = () => (
  <Card.Root variant="primary" h="full" overflow="hidden">
    <Card.Body>
      <VStack gap="4" align="stretch" h="full">
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
    </Card.Body>
  </Card.Root>
)

type CompactChallengeCarouselProps = {
  navigationId: string
  items: ChallengeView[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => Promise<unknown>
}

export const CompactChallengeCarousel = ({
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
            <ChallengeCard challenge={c} />
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
