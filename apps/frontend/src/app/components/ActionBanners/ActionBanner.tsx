import {
  useAccountLinking,
  useCanUserVote,
  useCurrentAllocationsRoundId,
  useGetDelegatee,
  useHasVotedInProposals,
  useIsCreatorOfAnyApp,
  useUserBotSignals,
  useUserDelegation,
  useVotingRewards,
  useGMRewards,
  useXApps,
  useGetUserNodes,
} from "@/api"
import { useCreatorSubmission } from "@/api/contracts/x2EarnCreator/useCreatorSubmission"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { HumanizedTicketStatus } from "@/utils/FreshDeskClient"
import { Show, IconButton, useMediaQuery } from "@chakra-ui/react"
import { useAccountBalance, useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo, useRef, useState } from "react"
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6"
// import Swiper core and required modules
import { A11y } from "swiper/modules"
// Import Swiper React components
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react"

import { CastVoteBanner } from "./components/CastVoteBanner"
import { ClaimVotingRewardsBanner } from "./components/ClaimVotingRewardsBanner"
import { CreatorApplicationApprovedBanner } from "./components/CreatorNFTBanner/CreatorApplicationApprovedBanner"
import { CreatorApplicationRejectedBanner } from "./components/CreatorNFTBanner/CreatorApplicationRejectedBanner"
import { CreatorApplicationUnderReviewBanner } from "./components/CreatorNFTBanner/CreatorApplicationUnderReviewBanner"
import { DoActionBanner } from "./components/DoActionBanner"
import { LowVthoBanner } from "./components/LowVthoBanner"
import { NewAppBanner } from "./components/NewAppBanner"
import { DelegatingBanner } from "./components/DelegatingBanner"
import { StargateMigrationBanner } from "./components/StargateMigrationBanner"

import "@/app/theme/swiper-custom.css"
// Import Swiper styles
import "swiper/css"
import { CastProposalVoteBanners } from "./components/CastProposalVoteBanners"
import { ProposalFilter } from "@/store"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { UserSignaledBanner } from "./components/UserSignaledBanner"
import { useGetB3trBalance, useGetVot3Balance, useIsVeDelegated } from "@/hooks"

// VTHO threshold for low VTHO that triggers the banner
const VTHO_THRESHOLD = 5

export const ActionBanner = () => {
  // store controlled swiper instance
  const swiperRef = useRef<SwiperClass | null>(null) // Create a ref for the Swiper instance with type
  const [isSliderEnd, setIsSliderEnd] = useState(false)
  const [isSliderStart, setIsSliderStart] = useState(true)
  const [isAboveMd] = useMediaQuery(["(min-width: 768px)"])

  const handleSliderChange = useCallback((_swiper: SwiperClass) => {
    setIsSliderEnd(_swiper.isEnd)
    setIsSliderStart(_swiper.isBeginning)
  }, [])

  const { account, connection } = useWallet()

  const { isVeDelegated } = useIsVeDelegated(account?.address ?? "")

  const { data: currentRound } = useCurrentAllocationsRoundId()

  const currentRoundId = parseInt(currentRound ?? "0")
  const votingRewardsQuery = useVotingRewards(currentRoundId, account?.address ?? undefined)
  const { data: { original: gmRewards } = { original: "0" } } = useGMRewards(
    currentRoundId,
    account?.address ?? undefined,
  )

  const { data: delegateeAddress, isLoading: isDelegateeLoading } = useGetDelegatee(account?.address)

  const { data: balance, isLoading: balanceLoading } = useAccountBalance(account?.address ?? undefined)
  const { data: b3trBalance, isLoading: b3trBalanceLoading } = useGetB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance, isLoading: vot3BalanceLoading } = useGetVot3Balance(account?.address ?? undefined)
  const { data: xApps } = useXApps({ filterBlacklisted: true })

  const { filteredProposals: activeProposals, isLoading: isLoadingProposals } = useFilteredProposals([
    ProposalFilter.InThisRound,
  ])
  const { data: hasVotedInProposals, isLoading: isLoadingHasVotedInProposals } = useHasVotedInProposals(
    activeProposals?.map(proposal => proposal?.proposalId),
    account?.address ?? undefined,
  )

  const hasProposals = activeProposals?.length > 0 && !isLoadingProposals && !isLoadingHasVotedInProposals

  const { isEntity, isLoading: isLoadingAccountLinking } = useAccountLinking()
  const { isDelegator, isLoading: isLoadingDelegator } = useUserDelegation()

  const { data: userSignalCounter } = useUserBotSignals(account?.address ?? "")

  const {
    data: canUserVote,
    hasVotesAtSnapshot,
    isPerson,
    isLoading,
  } = useCanUserVote(account?.address ?? undefined, delegateeAddress)

  const { data: userNodes } = useGetUserNodes(account?.address ?? "")

  // Custom computed values
  const isUserSignaled = useMemo(() => {
    return userSignalCounter && Number(userSignalCounter || 0) > 0
  }, [userSignalCounter])

  const ownsTokens = useMemo(() => {
    if (!b3trBalance || !vot3Balance) return false

    return b3trBalance.original !== "0" || vot3Balance.original !== "0"
  }, [b3trBalance, vot3Balance])

  const isLowOnVtho = useMemo(() => {
    return Number(balance?.energy ?? "0") < VTHO_THRESHOLD
  }, [balance])

  const isBalanceLoading = useMemo(() => {
    return balanceLoading || b3trBalanceLoading || vot3BalanceLoading
  }, [balanceLoading, b3trBalanceLoading, vot3BalanceLoading])

  const userCanVoteInProposals = useMemo<boolean>(() => {
    const isLoading = isLoadingAccountLinking || isLoadingDelegator
    const isValidUser = !isEntity && !isDelegator && hasVotesAtSnapshot && !!isPerson
    return !isLoading && isValidUser
  }, [isEntity, isDelegator, hasVotesAtSnapshot, isPerson, isLoadingAccountLinking, isLoadingDelegator])

  // Creator banners
  const { data: submissions, isLoading: submissionsLoading } = useCreatorSubmission(account?.address ?? "")
  const latestSubmissionStatus = submissions?.submissions[0]?.status // Only take into account the latest submission
  const isLatestSubmissionRejected = latestSubmissionStatus === HumanizedTicketStatus.Closed
  const isLatestSubmissionOngoing =
    latestSubmissionStatus === HumanizedTicketStatus.Open ||
    latestSubmissionStatus === HumanizedTicketStatus.Pending ||
    latestSubmissionStatus === HumanizedTicketStatus.WaitingOnCustomer ||
    latestSubmissionStatus === HumanizedTicketStatus.WaitingOnDev
  const { data: hasCreatorNFT } = useHasCreatorNFT(account?.address ?? "") // No loading state
  const { data: hasAlreadySubmitted } = useIsCreatorOfAnyApp(account?.address ?? "")
  // New Apps banner logic
  const newApps = (xApps?.newApps ?? []).length > 0

  // Can't Vote banners logic
  const showSignaledBanner = !!account?.address && isUserSignaled
  const showLowVthoBanner =
    !!account?.address && isLowOnVtho && ownsTokens && !isBalanceLoading && !connection?.isConnectedWithPrivy
  const showDoActionBanner = !!account?.address && !isPerson && !isLoading && !isDelegateeLoading
  const showDelegatingBanner = !!account?.address && isVeDelegated && !isDelegateeLoading

  const showCastVoteBanner = !!account?.address && !isLoading && canUserVote

  const showClaimB3trBanner =
    !!account?.address && votingRewardsQuery.data?.total && Number(votingRewardsQuery.data.total) !== 0

  // Creator NFT banners logic
  const showCreatorRejectedBanner =
    !!account?.address && !hasCreatorNFT && !submissionsLoading && isLatestSubmissionRejected
  const showCreatorApprovedBanner = !!account?.address && hasCreatorNFT && !hasAlreadySubmitted
  const showCreatorUnderReviewBanner =
    !!account?.address && !hasCreatorNFT && !submissionsLoading && isLatestSubmissionOngoing

  const showCastVoteInProposalBanners = !!account?.address && hasProposals && userCanVoteInProposals

  //Show one of the banners explainining why the user can't vote
  // Only one of the following banners can be shown at a time
  // The order of the banners is as follows:
  // 1 - User is signaled
  // 2 - User has low VTHO
  // 3 - User has to do some action
  const showCantVoteBanners = showSignaledBanner || showLowVthoBanner || showDoActionBanner || showDelegatingBanner
  const CantVoteBanner = useMemo(() => {
    if (showSignaledBanner) return <UserSignaledBanner key="user-signaled" />
    if (showLowVthoBanner) return <LowVthoBanner key="low-vtho" />
    if (showDelegatingBanner) return <DelegatingBanner key="delegating" />
    if (showDoActionBanner) return <DoActionBanner key="do-action" />
  }, [showSignaledBanner, showLowVthoBanner, showDoActionBanner, showDelegatingBanner])

  //Show one of the banners for creator NFTs
  // Only one of the following banners can be shown at a time
  // The order of the banners is as follows:
  // 1 - Creator application rejected
  // 2 - Creator application approved
  // 3 - Creator application under review
  const showCreatorNftBanners = showCreatorRejectedBanner || showCreatorApprovedBanner || showCreatorUnderReviewBanner
  const CreatorNftBanner = useMemo(() => {
    if (showCreatorRejectedBanner) return <CreatorApplicationRejectedBanner key="creator-rejected" />
    if (showCreatorApprovedBanner) return <CreatorApplicationApprovedBanner key="creator-approved" />
    if (showCreatorUnderReviewBanner) return <CreatorApplicationUnderReviewBanner key="creator-under-review" />
  }, [showCreatorRejectedBanner, showCreatorApprovedBanner, showCreatorUnderReviewBanner])

  // Legacy Node banners logic
  const isLegacyNode = useMemo(() => (userNodes?.legacyNodes?.length ?? 0) > 0, [userNodes])
  // Remove the banner for every user at the end of this round
  const showStargateBanner = currentRoundId < 55 || isLegacyNode

  //Custom compute proposal banners
  const proposalsToVoteBanners = activeProposals
    .filter(proposal => hasVotedInProposals && !hasVotedInProposals[proposal.proposalId])
    .map(proposal => (
      <CastProposalVoteBanners
        key={`cast-vote-in-proposal-${proposal?.proposalId}`}
        id={proposal?.proposalId}
        description={proposal?.description}
      />
    ))

  const slides = useMemo(() => {
    const bannerComponents = []
    if (showCantVoteBanners) bannerComponents.push(CantVoteBanner)
    if (showClaimB3trBanner)
      bannerComponents.push(
        <ClaimVotingRewardsBanner
          roundsRewardsQuery={votingRewardsQuery}
          gmRewards={Number(gmRewards)}
          key="claim-b3tr"
        />,
      )
    if (showCastVoteBanner) bannerComponents.push(<CastVoteBanner key="cast-vote" />)
    if (showCastVoteInProposalBanners) bannerComponents.push(...proposalsToVoteBanners)
    if (showStargateBanner)
      bannerComponents.push(<StargateMigrationBanner isLegacyNode={isLegacyNode} key="stargate-migration" />)

    if (newApps) bannerComponents.push(<NewAppBanner key="new-app" />)
    if (showCreatorNftBanners) bannerComponents.push(CreatorNftBanner)

    return bannerComponents
  }, [
    isLegacyNode,
    showCantVoteBanners,
    CantVoteBanner,
    showClaimB3trBanner,
    votingRewardsQuery,
    gmRewards,
    showCastVoteBanner,
    showCastVoteInProposalBanners,
    proposalsToVoteBanners,
    newApps,
    showCreatorNftBanners,
    CreatorNftBanner,
    showStargateBanner,
    isLegacyNode,
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
      <Show when={!isAboveMd}>
        {!isSliderStart && (
          <IconButton
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
      </Show>
      <Show when={!isAboveMd}>
        {!isSliderEnd && slides.length > 1 && (
          <IconButton
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
      </Show>
    </Swiper>
  )
}
