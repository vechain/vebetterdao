import { HumanizedTicketStatus } from "@/utils/FreshDeskClient"
import { useWallet } from "@vechain/vechain-kit"
import {
  CreatorApplicationApproved,
  CreatorApplicationInProgress,
  CreatorApplicationRejected,
  CreatorApplyNow,
} from "./creatorBanners"
import { useHasCreatorNFT, useCreatorSubmission } from "@/api/contracts/x2EarnCreator"
import { useIsCreatorOfAnyApp } from "@/api/contracts/xApps"

export const CreatorBanner = () => {
  const { account } = useWallet()

  const { data: submissions, isLoading: submissionsLoading } = useCreatorSubmission(account?.address ?? "")
  const latestSubmissionStatus = submissions?.submissions[0]?.status // Only take into account the latest submission
  const isLatestSubmissionRejected = latestSubmissionStatus === HumanizedTicketStatus.Closed
  const isLatestSubmissionOngoing =
    latestSubmissionStatus === HumanizedTicketStatus.Open ||
    latestSubmissionStatus === HumanizedTicketStatus.Pending ||
    latestSubmissionStatus === HumanizedTicketStatus.WaitingOnCustomer ||
    latestSubmissionStatus === HumanizedTicketStatus.WaitingOnDev

  const hasCreatorNFT = useHasCreatorNFT(account?.address ?? "") // No loading state
  const { data: hasAlreadySubmitted } = useIsCreatorOfAnyApp(account?.address ?? "")

  const isApproved = !!account?.address && hasCreatorNFT && !hasAlreadySubmitted
  const isRejected = !!account?.address && !hasCreatorNFT && !submissionsLoading && isLatestSubmissionRejected
  const isInProgress = !!account?.address && !hasCreatorNFT && !submissionsLoading && isLatestSubmissionOngoing

  if (isApproved) {
    return <CreatorApplicationApproved />
  }

  if (isRejected) {
    return <CreatorApplicationRejected />
  }

  if (isInProgress) {
    return <CreatorApplicationInProgress />
  }

  if (hasAlreadySubmitted) {
    return null
  }

  return <CreatorApplyNow />
}
