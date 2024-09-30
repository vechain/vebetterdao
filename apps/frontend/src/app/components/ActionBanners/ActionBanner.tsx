import { useCallback, useMemo, useRef } from "react"
import { DoActionBanner } from "./components/DoActionBanner"
import { motion, AnimatePresence } from "framer-motion"
import { Flex, IconButton, Show, Box } from "@chakra-ui/react"
import { ClaimB3trBanner } from "./components/ClaimB3trBanner"
import { useCanUserVote, useCurrentRoundReward } from "@/api"
import { CastVoteBanner } from "./components/CastVoteBanner"
import { UilArrowLeft, UilArrowRight } from "@iconscout/react-unicons"
import { useIsPerson } from "@/api/contracts/vePassport/hooks/useIsPerson"

export const ActionBanner = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { rewards, isLoading: isRoundRewardLoading } = useCurrentRoundReward()
  const { data: isPerson, isLoading: isPersonLoading } = useIsPerson()
  const { data: canUserVote, isLoading: canUserVoteLoading } = useCanUserVote()

  const showDoActionBanner = !isPersonLoading && !isPerson
  const showClaimB3trBanner = !isRoundRewardLoading && rewards > 0
  const showCastVoteBanner = !canUserVoteLoading && canUserVote

  const scroll = useCallback((direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth + 16
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }, [])

  const visibleBanners = useMemo(() => {
    const banners = []
    if (showDoActionBanner) banners.push(<DoActionBanner />)
    if (showClaimB3trBanner) banners.push(<ClaimB3trBanner />)
    if (showCastVoteBanner) banners.push(<CastVoteBanner />)
    return banners
  }, [showDoActionBanner, showClaimB3trBanner, showCastVoteBanner])

  const showArrows = useMemo(() => {
    return visibleBanners.length > 1
  }, [visibleBanners])

  if (!visibleBanners.length) return null

  return (
    <AnimatePresence>
      <Box position="relative" minW="full">
        {showArrows && (
          <Show above="md">
            <IconButton
              variant="primaryIconButton"
              zIndex={2}
              position="absolute"
              left={-50}
              top={"calc(50% - 20px)"}
              aria-label="Scroll left"
              icon={<UilArrowLeft />}
              onClick={() => scroll("left")}
            />
          </Show>
        )}
        <motion.div
          style={{
            overflow: "hidden",
            minWidth: "100%",
          }}
          initial={{ height: 0, opacity: 0 }}
          exit={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          transition={{ duration: 0.3 }}>
          <Flex
            gap={4}
            pb={2}
            overflowX="auto"
            minW="full"
            ref={scrollContainerRef}
            sx={{
              "&::-webkit-scrollbar": {
                display: "none",
              },
            }}>
            {visibleBanners.map((banner, index) => (
              <Flex key={index} minW="full">
                {banner}
              </Flex>
            ))}
          </Flex>
        </motion.div>
        {showArrows && (
          <Show above="md">
            <IconButton
              variant="primaryIconButton"
              zIndex={2}
              position="absolute"
              right={-50}
              top={"calc(50% - 20px)"}
              aria-label="Scroll right"
              icon={<UilArrowRight />}
              onClick={() => scroll("right")}
            />
          </Show>
        )}
      </Box>
    </AnimatePresence>
  )
}
