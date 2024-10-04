import { useState, useCallback, useMemo, useRef } from "react"
import { IconButton, Hide } from "@chakra-ui/react"
import { DoActionBanner } from "./components/DoActionBanner"
import { ClaimVotingRewardsBanner } from "./components/ClaimVotingRewardsBanner"
import { useCanUserVote, useVotingRewards } from "@/api"
import { CastVoteBanner } from "./components/CastVoteBanner"
import { useIsUserPerson } from "@/api/contracts/vePassport/hooks/useIsPerson"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"
// Import Swiper React components
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react"
// import Swiper core and required modules
import { A11y } from "swiper/modules"

// Import Swiper styles
import "swiper/css"
import "@/app/theme/swiper-custom.css"

export const ActionBanner = () => {
  // store controlled swiper instance
  const swiperRef = useRef<SwiperClass | null>(null) // Create a ref for the Swiper instance with type
  const [isSliderEnd, setIsSliderEnd] = useState(false)
  const [isSliderStart, setIsSliderStart] = useState(true)

  const handleSliderChange = useCallback((_swiper: SwiperClass) => {
    setIsSliderEnd(_swiper.isEnd)
    setIsSliderStart(_swiper.isBeginning)
  }, [])

  const votingRewardsQuery = useVotingRewards()
  const { data: isPerson, isLoading: isPersonLoading } = useIsUserPerson()
  const { data: canUserVote, isLoading: canUserVoteLoading } = useCanUserVote()

  const showDoActionBanner = !isPersonLoading && !isPerson
  const showClaimB3trBanner = votingRewardsQuery.data?.total && votingRewardsQuery.data.total !== 0
  const showCastVoteBanner = !canUserVoteLoading && canUserVote

  const slides = useMemo(() => {
    const bannerComponents = []
    if (showDoActionBanner) bannerComponents.push(<DoActionBanner key="do-action" />)
    if (showCastVoteBanner) bannerComponents.push(<CastVoteBanner key="cast-vote" />)
    if (showClaimB3trBanner) bannerComponents.push(<ClaimVotingRewardsBanner key="claim-b3tr" />)
    return bannerComponents
  }, [showDoActionBanner, showClaimB3trBanner, showCastVoteBanner])

  const slidesPerView = slides.length === 1 ? 1 : 1.1

  if (slides.length === 0) return null

  return (
    <Swiper
      modules={[A11y]}
      spaceBetween={20} // Space between slides
      slidesPerView={slidesPerView} // Show 1.1 slides, allowing part of the next and previous slides to be visible
      navigation={false} // Disable Swiper's built-in navigation
      pagination={{ clickable: true }}
      scrollbar={{ draggable: true }}
      onSwiper={swiper => (swiperRef.current = swiper)} // Store swiper instance
      onSlideChange={handleSliderChange}
      style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden" }} // Ensure swiper itself takes full width
    >
      {slides.map((slide, index) => (
        <SwiperSlide
          key={index}
          className="slide"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            position: "relative",
          }}>
          {slide}
        </SwiperSlide>
      ))}

      {/* Custom Navigation Buttons */}
      <Hide below="md">
        {!isSliderStart && (
          <IconButton
            pos={"absolute"}
            zIndex={2} // Ensure it's above the slides
            variant={"primarySubtle"}
            left={5}
            top={"50%"}
            transform={"translateY(-50%)"}
            icon={<FaChevronLeft />}
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Prev slide"
          />
        )}
      </Hide>
      <Hide below="md">
        {!isSliderEnd && slides.length > 1 && (
          <IconButton
            pos={"absolute"}
            zIndex={2} // Ensure it's above the slides
            variant={"primarySubtle"}
            right={5}
            top={"50%"}
            transform={"translateY(-50%)"}
            icon={<FaChevronRight />}
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Next slide"
          />
        )}
      </Hide>
    </Swiper>
  )
}
