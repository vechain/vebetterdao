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

import { ChallengeKind } from "@/api/challenges/types"
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
