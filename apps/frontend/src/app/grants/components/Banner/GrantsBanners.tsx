import { useProposalClaimableUserDeposits } from "@/api/contracts/governance/hooks"
import { IconButton } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo, useRef, useState } from "react"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"
// import Swiper core and required modules
import { A11y } from "swiper/modules"
// Import Swiper React components
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react"

import { ClaimTokensBanner } from "./ClaimTokensBanner"

import "@/app/theme/swiper-custom.css"
// Import Swiper styles
import "swiper/css"

export const GrantsBanners = () => {
  const { account } = useWallet()
  // store controlled swiper instance
  const swiperRef = useRef<SwiperClass | null>(null) // Create a ref for the Swiper instance with type
  const [isSliderEnd, setIsSliderEnd] = useState(false)
  const [isSliderStart, setIsSliderStart] = useState(true)

  const handleSliderChange = useCallback((_swiper: SwiperClass) => {
    setIsSliderEnd(_swiper.isEnd)
    setIsSliderStart(_swiper.isBeginning)
  }, [])

  //User Proposal Claimable Deposit Tokens
  const { data: { totalClaimableDeposits, claimableDeposits } = { totalClaimableDeposits: 0, claimableDeposits: [] } } =
    useProposalClaimableUserDeposits(account?.address ?? "")

  const shouldShowClaimTokensBanner = useMemo(() => {
    return totalClaimableDeposits > 0 && claimableDeposits.length > 0 && !!account?.address
  }, [totalClaimableDeposits, claimableDeposits.length, account?.address])

  const slides = useMemo(() => {
    const bannerComponents = []
    if (shouldShowClaimTokensBanner) bannerComponents.push(<ClaimTokensBanner key="claim-tokens" />)
    return bannerComponents
  }, [shouldShowClaimTokensBanner])

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
      {slides.map(slide => (
        <SwiperSlide
          key={`slide-${slide?.key}`}
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

      {!isSliderStart && (
        <IconButton
          hideBelow="md"
          pos={"absolute"}
          zIndex={2} // Ensure it's above the slides
          variant={"primarySubtle"}
          left={5}
          top={"50%"}
          transform={"translateY(-50%)"}
          onClick={() => swiperRef.current?.slidePrev()}
          aria-label="Prev slide">
          <FaChevronLeft />
        </IconButton>
      )}

      {!isSliderEnd && slides.length > 1 && (
        <IconButton
          hideBelow="md"
          pos={"absolute"}
          zIndex={2} // Ensure it's above the slides
          variant={"primarySubtle"}
          right={5}
          top={"50%"}
          transform={"translateY(-50%)"}
          onClick={() => swiperRef.current?.slideNext()}
          aria-label="Next slide">
          <FaChevronRight />
        </IconButton>
      )}
    </Swiper>
  )
}
