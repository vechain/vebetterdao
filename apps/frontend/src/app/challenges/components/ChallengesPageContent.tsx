"use client"

import {
  Box,
  Button,
  Card,
  HStack,
  Icon,
  IconButton,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6"
import { A11y, Navigation } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import { ChallengeKind, ChallengeView } from "@/api/challenges/types"
import { useChallengesHub } from "@/api/challenges/useChallengesHub"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { Modal } from "@/components/Modal"
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
  const [isInfoOpen, setIsInfoOpen] = useState(false)
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
          <Text as="h1" textStyle={{ base: "2xl", md: "3xl" }} fontWeight="bold">
            {t("Challenges")}
          </Text>
          <HStack gap="2" flexShrink={0} flexWrap="wrap">
            <CreateChallengeModal defaultKind={ChallengeKind.Stake} currentRound={round}>
              <Button variant="primary" size="sm">
                {t("Create challenge")}
              </Button>
            </CreateChallengeModal>
            <Button
              variant="ghost"
              size="sm"
              borderRadius="full"
              bg="bg.secondary"
              borderWidth="1px"
              borderColor="border.primary"
              px="3.5"
              py="2"
              h="auto"
              minH="unset"
              boxShadow="xs"
              color="text.subtle"
              _hover={{ bg: "bg.secondary", color: "primary.500" }}
              _active={{ bg: "bg.secondary" }}
              display="inline-flex"
              alignItems="center"
              gap="2"
              fontWeight="semibold"
              lineHeight="1"
              textStyle="sm"
              onClick={() => setIsInfoOpen(true)}>
              <Icon as={UilInfoCircle} boxSize={4} />
              {t("More info")}
            </Button>
          </HStack>
        </Stack>

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

      <ChallengesInfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
    </MotionVStack>
  )
}

const ChallengesInfoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation()
  const quickActions = [
    t("Join open challenges, keep up with active ones, and review past participation."),
    t("Create a challenge to invite others to take action or support an app."),
    t("See which section needs your attention right now so you can act faster."),
  ]
  const challengeSections = [
    {
      title: t("Needed actions"),
      description: t(
        "Challenges waiting for your next step, such as joining, submitting proof, or confirming progress.",
      ),
    },
    {
      title: t("Your active challenges"),
      description: t("Challenges you are currently participating in."),
    },
    {
      title: t("Open to join"),
      description: t("Challenges available for you to discover and join."),
    },
    {
      title: t("What others are doing"),
      description: t("Live challenges from other community members you may want to explore."),
    },
    {
      title: t("History"),
      description: t("Completed or past challenges, including the ones you joined before."),
    },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("About Challenges")}
      showCloseButton
      modalContentProps={{
        scrollbar: "hidden",
        css: {
          "&::-webkit-scrollbar": { display: "none" },
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
      }}>
      <VStack align="stretch" gap={4} pt={{ base: 2, md: 3 }}>
        <Card.Root variant="primary" borderRadius="3xl" boxShadow="sm">
          <Card.Body p={{ base: "5", md: "6" }} gap="4">
            <HStack align="start" gap="3">
              <Box borderRadius="2xl" bg="bg.secondary" p="2.5" flexShrink={0}>
                <Icon as={UilInfoCircle} boxSize={5} color="primary.500" />
              </Box>
              <VStack align="stretch" gap="1.5">
                <Text fontWeight="semibold" textStyle={{ base: "lg", md: "xl" }}>
                  {t("What is the Challenges page?")}
                </Text>
                <Text textStyle="sm" color="text.muted">
                  {t("Challenges description")}{" "}
                  {t(
                    "The Challenges page helps you discover, join, create, and track community challenges in one place.",
                  )}
                </Text>
              </VStack>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Card.Root variant="subtle" borderRadius="2xl">
          <Card.Body p={{ base: "4", md: "5" }} gap="4">
            <Text fontWeight="semibold">{t("What can you do here?")}</Text>
            <VStack align="stretch" gap="3">
              {quickActions.map(action => (
                <HStack key={action} align="start" gap="3">
                  <Box boxSize="2" mt="1.5" borderRadius="full" bg="primary.500" flexShrink={0} />
                  <Text textStyle="sm" color="text.muted">
                    {action}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>

        <VStack align="stretch" gap="3">
          <Text fontWeight="semibold">{t("How are challenges organized?")}</Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="3">
            {challengeSections.map(section => (
              <Card.Root key={section.title} variant="subtle" borderRadius="2xl">
                <Card.Body p={{ base: "4", md: "5" }} gap="2">
                  <Text fontWeight="semibold">{section.title}</Text>
                  <Text textStyle="sm" color="text.muted">
                    {section.description}
                  </Text>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        </VStack>
      </VStack>
    </Modal>
  )
}
