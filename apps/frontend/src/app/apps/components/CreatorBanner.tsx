import { HumanizedTicketStatus } from "@/utils/FreshDeskClient"
import { useWallet } from "@vechain/dapp-kit-react"
import {
  CreatorApplicationApproved,
  CreatorApplicationInProgress,
  CreatorApplicationRejected,
  CreatorApplyNow,
} from "./creatorBanners"
import { useCreatorSubmission } from "@/api/contracts/x2EarnCreator/hooks/useCreatorSubmission"
import { useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/useHasCreatorNft"

export const CreatorBanner = () => {
  const { account } = useWallet()

  const { data: submissions, isLoading: submissionsLoading } = useCreatorSubmission(account ?? "")
  const latestSubmissionStatus = submissions?.submissions[0]?.status // Only take into account the latest submission
  const isLatestSubmissionRejected = latestSubmissionStatus === HumanizedTicketStatus.Closed
  const isLatestSubmissionOngoing =
    latestSubmissionStatus === HumanizedTicketStatus.Open ||
    latestSubmissionStatus === HumanizedTicketStatus.Pending ||
    latestSubmissionStatus === HumanizedTicketStatus.WaitingOnCustomer ||
    latestSubmissionStatus === HumanizedTicketStatus.WaitingOnDev

  const hasCreatorNFT = useHasCreatorNFT(account ?? "") // No loading state

  const isApproved = !!account && hasCreatorNFT
  const isRejected = !!account && !hasCreatorNFT && !submissionsLoading && isLatestSubmissionRejected
  const isInProgress = !!account && !hasCreatorNFT && !submissionsLoading && isLatestSubmissionOngoing

  if (isApproved) {
    return <CreatorApplicationApproved /> // TODO couple to "submit app flow"
  }

  if (isRejected) {
    return <CreatorApplicationRejected /> // TODO update support link
  }

  if (isInProgress) {
    return <CreatorApplicationInProgress />
  }

  return <CreatorApplyNow /> // TODO couple to "submit creator flow"
}
