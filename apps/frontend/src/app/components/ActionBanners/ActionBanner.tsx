import { useState, useCallback, useMemo, useRef } from "react"
import { IconButton, Hide } from "@chakra-ui/react"
import { DoActionBanner } from "./components/DoActionBanner"
import { ClaimVotingRewardsBanner } from "./components/ClaimVotingRewardsBanner"
import {
  useAccountBalance,
  useB3trBalance,
  useCanUserVote,
  useCurrentAllocationsRoundId,
  useGetDelegatee,
  useVot3Balance,
  useVotingRewards,
} from "@/api"
import { CastVoteBanner } from "./components/CastVoteBanner"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"
// Import Swiper React components
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react"
// import Swiper core and required modules
import { A11y } from "swiper/modules"

// Import Swiper styles
import "swiper/css"
import "@/app/theme/swiper-custom.css"
import { useWallet } from "@vechain/dapp-kit-react"
import { LowVthoBanner } from "./components/LowVthoBanner"
import { CreatorApplicationRejectedBanner } from "./components/CreatorNFTBanner/CreatorApplicationRejectedBanner"
import { CreatorApplicationApprovedBanner } from "./components/CreatorNFTBanner/CreatorApplicationApprovedBanner"
import { useCreatorSubmission } from "@/api/contracts/x2EarnCreator/hooks/useCreatorSubmission"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { HumanizedTicketStatus } from "@/utils/FreshDeskClient"
import { CreatorApplicationUnderReviewBanner } from "./components/CreatorNFTBanner/CreatorApplicationUnderReviewBanner"
// VTHO threshold for low VTHO that triggers the banner
const VTHO_THRESHOLD = 5

export const ActionBanner = () => {
  // store controlled swiper instance
  const swiperRef = useRef<SwiperClass | null>(null) // Create a ref for the Swiper instance with type
  const [isSliderEnd, setIsSliderEnd] = useState(false)
  const [isSliderStart, setIsSliderStart] = useState(true)

  const handleSliderChange = useCallback((_swiper: SwiperClass) => {
    setIsSliderEnd(_swiper.isEnd)
    setIsSliderStart(_swiper.isBeginning)
  }, [])

  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { account } = useWallet()

  const votingRewardsQuery = useVotingRewards(currentRoundId, account ?? undefined)
  const { data: delegateeAddress, isLoading: isDelegateeLoading } = useGetDelegatee(account)

  const { data: balance, isLoading: balanceLoading } = useAccountBalance(account ?? undefined)
  const { data: b3trBalance, isLoading: b3trBalanceLoading } = useB3trBalance(account ?? undefined)
  const { data: vot3Balance, isLoading: vot3BalanceLoading } = useVot3Balance(account ?? undefined)

  const ownsTokens = useMemo(() => {
    if (!b3trBalance || !vot3Balance) return false

    return b3trBalance.original !== "0" || vot3Balance.original !== "0"
  }, [b3trBalance, vot3Balance])

  const isLowOnVtho = useMemo(() => {
    return Number(balance?.energy.scaled) < VTHO_THRESHOLD
  }, [balance])

  const isBalanceLoading = useMemo(() => {
    return balanceLoading || b3trBalanceLoading || vot3BalanceLoading
  }, [balanceLoading, b3trBalanceLoading, vot3BalanceLoading])

  const { data: canUserVote, isPerson, isLoading } = useCanUserVote(account ?? undefined, delegateeAddress)

  // Creator banners
  const { data: submissions, isLoading: submissionsLoading } = useCreatorSubmission(account ?? "")
  const latestSubmissionStatus = submissions?.submissions[0]?.status // Only take into account the latest submission
  const isLatestSubmissionRejected = latestSubmissionStatus === HumanizedTicketStatus.Closed
  const isLatestSubmissionOngoing =
    latestSubmissionStatus === HumanizedTicketStatus.Open ||
    latestSubmissionStatus === HumanizedTicketStatus.Pending ||
    latestSubmissionStatus === HumanizedTicketStatus.WaitingOnCustomer ||
    latestSubmissionStatus === HumanizedTicketStatus.WaitingOnDev
  const hasCreatorNFT = useHasCreatorNFT(account ?? "") // No loading state

  const showDoActionBanner = !!account && !isPerson && !isLoading && !isDelegateeLoading
  const showClaimB3trBanner = !!account && votingRewardsQuery.data?.total && Number(votingRewardsQuery.data.total) !== 0
  const showCastVoteBanner = !!account && !isLoading && canUserVote
  const showLowVthoBanner = !!account && isLowOnVtho && ownsTokens && !isBalanceLoading
  const showCreatorRejectedBanner = !!account && !hasCreatorNFT && !submissionsLoading && isLatestSubmissionRejected
  const showCreatorApprovedBanner = !!account && hasCreatorNFT
  const showCreatorUnderReviewBanner = !!account && !hasCreatorNFT && !submissionsLoading && isLatestSubmissionOngoing

  const slides = useMemo(() => {
    const bannerComponents = []
    if (showClaimB3trBanner) bannerComponents.push(<ClaimVotingRewardsBanner key="claim-b3tr" />)
    if (showLowVthoBanner) bannerComponents.push(<LowVthoBanner key="low-vtho" />)
    if (showDoActionBanner) bannerComponents.push(<DoActionBanner key="do-action" />)
    if (showCastVoteBanner) bannerComponents.push(<CastVoteBanner key="cast-vote" />)
    if (showCreatorRejectedBanner) bannerComponents.push(<CreatorApplicationRejectedBanner key="creator-rejected" />)
    if (showCreatorApprovedBanner) bannerComponents.push(<CreatorApplicationApprovedBanner key="creator-approved" />)
    if (showCreatorUnderReviewBanner)
      bannerComponents.push(<CreatorApplicationUnderReviewBanner key="creator-under-review" />)
    return bannerComponents
  }, [
    showDoActionBanner,
    showClaimB3trBanner,
    showCastVoteBanner,
    showLowVthoBanner,
    showCreatorRejectedBanner,
    showCreatorApprovedBanner,
    showCreatorUnderReviewBanner,
  ])

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
