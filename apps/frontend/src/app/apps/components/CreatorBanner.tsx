import { useCreatorSubmission, useHasCreatorNFT } from "@/api/contracts/x2EarnCreator/hooks"
import { HumanizedTicketStatus } from "@/utils/FreshDeskClient"
import { useWallet } from "@vechain/dapp-kit-react"
import {
  CreatorApplicationApproved,
  CreatorApplicationInProgress,
  CreatorApplicationRejected,
  CreatorApplyNow,
} from "./creatorBanners"

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

  if (!!account && hasCreatorNFT) {
    return <CreatorApplicationApproved /> // TODO couple to "submit app flow"
  }

  if (!!account && !submissionsLoading && isLatestSubmissionRejected) {
    return <CreatorApplicationRejected /> // TODO update support link
  }

  if (!!account && !submissionsLoading && isLatestSubmissionOngoing) {
    return <CreatorApplicationInProgress />
  }

  return <CreatorApplyNow /> // TODO couple to "submit creator flow"
}
