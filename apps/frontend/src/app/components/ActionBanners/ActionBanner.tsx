import { Box } from "@chakra-ui/react"
import { useAccountBalance, useWallet } from "@vechain/vechain-kit"
import { useMemo, useState } from "react"
import { A11y, Autoplay, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

import { useCreatorSubmission } from "@/api/contracts/x2EarnCreator/useCreatorSubmission"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"
import { useGetUserNodes } from "@/api/contracts/xNodes/useGetUserNodes"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { useUserPreferences } from "@/hooks/useUserPreferences"
import { HumanizedTicketStatus } from "@/utils/FreshDeskClient"

import { useCanUserVote } from "../../../api/contracts/governance/hooks/useCanUserVote"
import { useHasVotedInProposals } from "../../../api/contracts/governance/hooks/useHasVotedInProposals"
import { useProposalClaimableUserDeposits } from "../../../api/contracts/governance/hooks/useProposalClaimableUserDeposits"
import { useGMRewards } from "../../../api/contracts/rewards/hooks/useGMRewards"
import { useVotingRewards } from "../../../api/contracts/rewards/hooks/useVotingRewards"
import { useVeDelegateAutoDeposit } from "../../../api/contracts/veDelegate/hooks/useVeDelegateAutoDeposit"
import { useAccountLinking } from "../../../api/contracts/vePassport/hooks/useAccountLinking"
import { useGetDelegatee } from "../../../api/contracts/vePassport/hooks/useGetDelegatee"
import { useUserBotSignals } from "../../../api/contracts/vePassport/hooks/useUserBotSignals"
import { useUserDelegation } from "../../../api/contracts/vePassport/hooks/useUserDelegation"
import { useCurrentAllocationsRoundId } from "../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useIsCreatorOfAnyApp } from "../../../api/contracts/xApps/hooks/useIsCreatorOfAnyApp"
import { useXApps } from "../../../api/contracts/xApps/hooks/useXApps"
import { useProposalEnriched } from "../../../hooks/proposals/common/useProposalEnriched"
import { useGetB3trBalance } from "../../../hooks/useGetB3trBalance"
import { useGetVot3Balance } from "../../../hooks/useGetVot3Balance"
import { useIsVeDelegated } from "../../../hooks/useIsVeDelegated"
import { ProposalFilter } from "../../../store/useProposalFilters"
import { BannerStorageKey } from "../Banners/GenericBanner"

import { CastProposalVoteBanners } from "./components/CastProposalVoteBanners/CastProposalVoteBanners"
import { CastVoteBanner } from "./components/CastVoteBanner"
import { ClaimDepositsBanner } from "./components/ClaimDepositsBanner"
import { ClaimVotingRewardsBanner } from "./components/ClaimVotingRewardsBanner"
import { CreatorApplicationApprovedBanner } from "./components/CreatorNFTBanner/CreatorApplicationApprovedBanner"
import { CreatorApplicationRejectedBanner } from "./components/CreatorNFTBanner/CreatorApplicationRejectedBanner"
import { CreatorApplicationUnderReviewBanner } from "./components/CreatorNFTBanner/CreatorApplicationUnderReviewBanner"
import { DelegatingBanner } from "./components/DelegatingBanner"
import { DoActionBanner } from "./components/DoActionBanner/DoActionBanner"
import { EntityBanner } from "./components/EntityBanner"
import { LowVthoBanner } from "./components/LowVthoBanner/LowVthoBanner"
import { NewAppBanner } from "./components/NewAppBanner/NewAppBanner"
import { StargateMigrationBanner } from "./components/StargateMigrationBanner/StargateMigrationBanner"
import { UserSignaledBanner } from "./components/UserSignaledBanner/UserSignaledBanner"
import { NodeUpgradeModal } from "./modals/NodeUpgradeModal"

import "swiper/css"
import "swiper/css/pagination"
import "@/app/theme/swiper-custom.css"

// VTHO threshold for low VTHO that triggers the banner
const VTHO_THRESHOLD = 5

export const ActionBanner = () => {
  const { account, connection } = useWallet()
  const { preferences } = useUserPreferences()
  const isStargateModalHidden = preferences?.SHOW_STARGATE_BANNER !== true
  const [showModal, setShowModal] = useState(isStargateModalHidden)

  const { isVeDelegated } = useIsVeDelegated(account?.address ?? "")
  const { hasAutoDeposit } = useVeDelegateAutoDeposit(account?.address)

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

  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()
  const { filteredProposals: activeProposals, isLoading: isLoadingProposals } = useFilteredProposals(
    [ProposalFilter.InThisRound],
    enrichedProposals,
  )
  const { data: hasVotedInProposals, isLoading: isLoadingHasVotedInProposals } = useHasVotedInProposals(
    activeProposals?.map(proposal => proposal?.id),
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

  const { data: userNodesInfo } = useGetUserNodes(account?.address ?? undefined)

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
  const newApps = (xApps?.newApps ?? []).length > 0 && (preferences?.[BannerStorageKey.SHOW_NEW_APP] ?? true)

  // Claim tokens (VOT3 deposits) banner logic
  const { data: { totalClaimableDeposits, claimableDeposits } = { totalClaimableDeposits: 0, claimableDeposits: [] } } =
    useProposalClaimableUserDeposits(account?.address ?? "")
  const showClaimTokensBanner = totalClaimableDeposits > 0 && claimableDeposits.length > 0 && !!account?.address

  // Can't Vote banners logic
  const showSignaledBanner = !!account?.address && isUserSignaled
  const showLowVthoBanner =
    !!account?.address &&
    isLowOnVtho &&
    ownsTokens &&
    !isBalanceLoading &&
    !connection?.isConnectedWithPrivy &&
    (preferences?.[BannerStorageKey.SHOW_LOW_VTHO] ?? true)
  const showDoActionBanner =
    !!account?.address &&
    !isPerson &&
    !isLoading &&
    !isDelegateeLoading &&
    (preferences?.[BannerStorageKey.SHOW_DO_ACTION] ?? true)
  const showDelegatingBanner = !!account?.address && (isVeDelegated || hasAutoDeposit) && !isDelegateeLoading
  const showEntityBanner = !!account?.address && isEntity && !isLoadingAccountLinking

  const showCastVoteBanner = !!account?.address && !isLoading && canUserVote

  const showClaimB3trBanner =
    !!account?.address &&
    votingRewardsQuery.data?.claimableTotal &&
    Number(votingRewardsQuery.data.claimableTotal) !== 0

  // Creator NFT banners logic
  const showCreatorNftBannerPreference = preferences?.[BannerStorageKey.SHOW_CREATOR_NFT] ?? true
  const showCreatorRejectedBanner =
    !!account?.address &&
    showCreatorNftBannerPreference &&
    !hasCreatorNFT &&
    !submissionsLoading &&
    isLatestSubmissionRejected
  const showCreatorApprovedBanner =
    !!account?.address && showCreatorNftBannerPreference && hasCreatorNFT && !hasAlreadySubmitted
  const showCreatorUnderReviewBanner =
    !!account?.address &&
    showCreatorNftBannerPreference &&
    !hasCreatorNFT &&
    !submissionsLoading &&
    isLatestSubmissionOngoing

  const showCastVoteInProposalBanners = !!account?.address && hasProposals && userCanVoteInProposals

  //Show one of the banners explainining why the user can't vote
  // Only one of the following banners can be shown at a time
  // The order of the banners is as follows:
  // 1 - User is signaled
  // 2 - User has low VTHO
  // 3 - User is an entity (linked account)
  // 4 - User is delegating
  // 5 - User has to do some action
  const showCantVoteBanners =
    showSignaledBanner || showLowVthoBanner || showEntityBanner || showDoActionBanner || showDelegatingBanner
  const CantVoteBanner = useMemo(() => {
    if (showSignaledBanner) return <UserSignaledBanner key="user-signaled" />
    if (showLowVthoBanner) return <LowVthoBanner key="low-vtho" />
    if (showEntityBanner) return <EntityBanner key="entity" />
    if (showDelegatingBanner) return <DelegatingBanner key="delegating" />
    if (showDoActionBanner) return <DoActionBanner key="do-action" />
  }, [showSignaledBanner, showLowVthoBanner, showEntityBanner, showDoActionBanner, showDelegatingBanner])

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
  const userHasLegacyNode = userNodesInfo?.hasLegacyNode ?? false
  // Remove the banner for every user at the end of this round
  const showStargateBanner = userHasLegacyNode && isStargateModalHidden

  //Custom compute proposal banners
  const proposalsToVoteBanners = activeProposals
    .filter(proposal => hasVotedInProposals && !hasVotedInProposals[proposal.id])
    .map(proposal => (
      <CastProposalVoteBanners
        key={`cast-vote-in-proposal-${proposal?.id}`}
        id={proposal?.id}
        description={proposal?.ipfsDescription ?? ""}
      />
    ))

  const slides = useMemo(() => {
    const bannerComponents = []
    if (showCantVoteBanners) bannerComponents.push(CantVoteBanner)
    if (showClaimB3trBanner)
      bannerComponents.push(
        <ClaimVotingRewardsBanner
          roundRewards={votingRewardsQuery.data?.roundsRewards ?? []}
          totalFormatted={Number(votingRewardsQuery.data?.claimableTotalFormatted ?? 0)}
          gmRewards={Number(gmRewards)}
          key="claim-b3tr"
        />,
      )
    if (showClaimTokensBanner) bannerComponents.push(<ClaimDepositsBanner key="claim-deposits" />)
    if (showCastVoteBanner) bannerComponents.push(<CastVoteBanner key="cast-vote" />)
    if (showCastVoteInProposalBanners) bannerComponents.push(...proposalsToVoteBanners)
    if (showStargateBanner) bannerComponents.push(<StargateMigrationBanner key="stargate-migration" />)

    if (newApps) bannerComponents.push(<NewAppBanner key="new-app" />)
    if (showCreatorNftBanners) bannerComponents.push(CreatorNftBanner)

    return bannerComponents
  }, [
    showCantVoteBanners,
    CantVoteBanner,
    showClaimB3trBanner,
    votingRewardsQuery.data?.roundsRewards,
    votingRewardsQuery.data?.claimableTotalFormatted,
    gmRewards,
    showClaimTokensBanner,
    showCastVoteBanner,
    showCastVoteInProposalBanners,
    proposalsToVoteBanners,
    newApps,
    showCreatorNftBanners,
    CreatorNftBanner,
    showStargateBanner,
  ])

  if (slides.length === 0) return null

  return (
    <>
      <Box
        position="relative"
        css={{
          base: {
            "--swiper-pagination-top": "16px",
            "--swiper-pagination-bottom": "auto",
            "--swiper-pagination-left": "16px",
            "--swiper-pagination-bullet-size": "6px",
            "--swiper-pagination-text-align": "left",
          },
          lg: {
            "--swiper-pagination-top": "unset",
            "--swiper-pagination-bottom": "16px",
            "--swiper-pagination-left": "unset",
            "--swiper-pagination-bullet-size": "8px",
            "--swiper-pagination-text-align": "center",
          },
        }}>
        <Swiper
          modules={[A11y, Autoplay, Pagination]}
          rewind={true}
          pagination={{
            clickable: true,
          }}
          wrapperClass="action-banner"
          spaceBetween={20}
          speed={800}
          scrollbar={{ draggable: true }}
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true,
          }}>
          {slides.map(slide => (
            <SwiperSlide key={`slide-${slide?.key}`} className="slide">
              {slide}
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
      <NodeUpgradeModal isOpen={userHasLegacyNode && showModal} onClose={() => setShowModal(false)} />
    </>
  )
}
