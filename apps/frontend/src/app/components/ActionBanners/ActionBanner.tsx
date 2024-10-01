import { useState, useEffect, useCallback, useMemo } from "react"
import { Box, Flex, Button, Circle } from "@chakra-ui/react"
import { DoActionBanner } from "./components/DoActionBanner"
import { ClaimB3trBanner } from "./components/ClaimB3trBanner"
import { useCanUserVote, useCurrentRoundReward } from "@/api"
import { CastVoteBanner } from "./components/CastVoteBanner"
import { useIsPerson } from "@/api/contracts/vePassport/hooks/useIsPerson"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"

export const ActionBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const { rewards, isLoading: isRoundRewardLoading } = useCurrentRoundReward()
  const { data: isPerson, isLoading: isPersonLoading } = useIsPerson()
  const { data: canUserVote, isLoading: canUserVoteLoading } = useCanUserVote()

  const showDoActionBanner = !isPersonLoading && !isPerson
  const showClaimB3trBanner = !isRoundRewardLoading && rewards > 0
  const showCastVoteBanner = !canUserVoteLoading && canUserVote

  const banners = useMemo(() => {
    const bannerComponents = []
    if (showDoActionBanner) bannerComponents.push(<DoActionBanner key="do-action" />)
    if (showCastVoteBanner) bannerComponents.push(<CastVoteBanner key="cast-vote" />)
    if (showClaimB3trBanner) bannerComponents.push(<ClaimB3trBanner key="claim-b3tr" />)
    return bannerComponents
  }, [showDoActionBanner, showClaimB3trBanner, showCastVoteBanner])

  const nextSlide = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % banners.length)
  }, [banners.length])

  const prevSlide = useCallback(() => {
    setCurrentIndex(prevIndex => (prevIndex - 1 + banners.length) % banners.length)
  }, [banners.length])

  useEffect(() => {
    let intervalId: NodeJS.Timeout

    if (isAutoPlaying && banners.length > 1) {
      intervalId = setInterval(nextSlide, 10000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [isAutoPlaying, nextSlide, banners.length])

  if (banners.length === 0) return null

  return (
    <Box position="relative" overflow="hidden" borderRadius="lg" w="full">
      <Flex
        transition="transform 0.5s ease-in-out"
        transform={`translateX(-${currentIndex * 100}%)`}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
        h="full">
        {banners.map((banner, index) => (
          <Box key={index} width="100%" flexShrink={0} h="full">
            {banner}
          </Box>
        ))}
      </Flex>

      {banners.length > 1 && (
        <>
          <Button
            position="absolute"
            top="50%"
            left="4"
            transform="translateY(-50%)"
            bg="blackAlpha.100"
            color="white"
            borderRadius="full"
            onClick={prevSlide}
            _hover={{ bg: "blackAlpha.300" }}>
            <FaChevronLeft size={12} />
          </Button>

          <Button
            position="absolute"
            top="50%"
            right="4"
            transform="translateY(-50%)"
            bg="blackAlpha.100"
            color="white"
            borderRadius="full"
            onClick={nextSlide}
            _hover={{ bg: "blackAlpha.300" }}>
            <FaChevronRight size={12} />
          </Button>

          <Flex position="absolute" bottom="4" left="50%" transform="translateX(-50%)" gap="2">
            {banners.map((_, index) => (
              <Circle
                key={index}
                size="3"
                bg={index === currentIndex ? "white" : "gray.400"}
                as="button"
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </Flex>
        </>
      )}
    </Box>
  )
}
