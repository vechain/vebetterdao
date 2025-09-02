import { useProposalsCreatedFromIds, useUserProposalsVoteEvents, useUserTopVotedApps } from "@/api"
import { useCallback, useMemo, useState } from "react"
import {
  EmptyStateGovernance,
  PaginatedProposals,
  PaginatedTopVotedApps,
  PreviewCreatedProposals,
  TopVotedApps,
} from "./components"
import { FaScaleBalanced, FaChartPie } from "react-icons/fa6"
import { useRouter } from "next/navigation"
import { HandPlantIcon, VoteBoxIcon } from "@/components"
import { PendingDelegationDelegateePOV } from "./components/delegation/PendingDelegationDelegateePOV"
import { CurrentDelegation } from "./components/delegation/CurrentDelegation"
import { VotingQualification } from "./components/delegation/VotingQualification"
import { AnalyticsUtils } from "@/utils"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"
import { useRetrieveProfilIdentity } from "@/app/profile/components/utils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { t } from "i18next"
import { useUserCreatedProposal } from "@/hooks/proposals/common"

enum ListView {
  ALL,
  CREATED,
  VOTED,
  APPS_VOTED,
}

const PREVIEW_SIZE = 3 // The number of proposals to show in the preview

type Props = {
  address: string
}
export const ProfileGovernance = ({ address }: Props) => {
  const { data: createdProposals } = useUserCreatedProposal(address ?? "")
  const { data: votedProposals } = useUserProposalsVoteEvents(address ?? "")

  const { isConnectedUser } = useRetrieveProfilIdentity()

  const router = useRouter()

  const votedProposalsIds = useMemo(() => votedProposals?.map(proposal => proposal.proposalId), [votedProposals])

  const { created: votedProposalsWithDescription } = useProposalsCreatedFromIds(votedProposalsIds)

  const topVotedApps = useUserTopVotedApps(address ?? "")

  const [listView, setListView] = useState<ListView>(ListView.ALL)

  const onSeeAllCreatedProposals = useCallback(() => {
    setListView(ListView.CREATED)
  }, [])

  const onSeeAllVotedProposals = useCallback(() => {
    setListView(ListView.VOTED)
  }, [])

  const onSeeAllAppsVoted = useCallback(() => {
    setListView(ListView.APPS_VOTED)
  }, [])

  const onGoBack = useCallback(() => {
    setListView(ListView.ALL)
  }, [])

  const onExploreGovernance = useCallback(() => {
    router.push("/proposals")
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.EXPLORE_GOVERNANCE_FROM_PROFILE))
  }, [router])

  const firstCreatedProposals = useMemo(() => createdProposals?.slice(0, PREVIEW_SIZE), [createdProposals])
  const firstVotedProposals = useMemo(
    () => votedProposalsWithDescription?.slice(0, PREVIEW_SIZE),
    [votedProposalsWithDescription],
  )
  const firstTopVotedApps = useMemo(() => topVotedApps?.slice(0, PREVIEW_SIZE), [topVotedApps])

  const isMoreCreatedProposals = useMemo(() => {
    if (!createdProposals) return false
    return createdProposals.length > PREVIEW_SIZE
  }, [createdProposals])

  const isMoreVotedProposals = useMemo(() => {
    if (!votedProposals) return false
    return votedProposals.length > PREVIEW_SIZE
  }, [votedProposals])

  const isMoreTopVotedApps = useMemo(() => {
    if (!topVotedApps) return false
    return topVotedApps.length > PREVIEW_SIZE
  }, [topVotedApps])

  const isFirstCreatedProposalsAvailable = firstCreatedProposals && firstCreatedProposals.length > 0
  const isFirstVotedProposalsAvailable = firstVotedProposals && firstVotedProposals.length > 0
  const isFirstTopVotedAppsAvailable = firstTopVotedApps && firstTopVotedApps.length > 0

  switch (listView) {
    case ListView.ALL:
      return (
        <>
          <PendingDelegationDelegateePOV address={address} isConnectedUser={isConnectedUser} />
          <CurrentDelegation address={address} isConnectedUser={isConnectedUser} />
          <VotingQualification address={address} isConnectedUser={isConnectedUser} />
          {isFirstCreatedProposalsAvailable && (
            <PreviewCreatedProposals
              firstProposals={firstCreatedProposals}
              isMoreProposals={isMoreCreatedProposals}
              isCreatedProposals
              onSeeAllProposals={onSeeAllCreatedProposals}
            />
          )}
          {isFirstVotedProposalsAvailable ? (
            <PreviewCreatedProposals
              firstProposals={firstVotedProposals}
              isMoreProposals={isMoreVotedProposals}
              onSeeAllProposals={onSeeAllVotedProposals}
            />
          ) : (
            <EmptyStateGovernance
              title={t("Voted Proposals")}
              description={t("{{subject}} voted proposals will appear here.", {
                subject: isConnectedUser ? "Your" : `${humanAddress(address ?? "", 4, 3)}`,
              })}
              buttonText={t("Explore governance")}
              illustration={<HandPlantIcon color="rgba(117, 117, 117, 1)" />}
              buttonIcon={FaScaleBalanced}
              onClick={onExploreGovernance}
            />
          )}
          {isFirstTopVotedAppsAvailable ? (
            <TopVotedApps
              votedApps={firstTopVotedApps}
              isMoreTopVotedApps={isMoreTopVotedApps}
              onSeeAllAppsVoted={onSeeAllAppsVoted}
            />
          ) : (
            <EmptyStateGovernance
              title={t("Most voted apps")}
              description={t("{{subject}} top voted apps will appear here.", {
                subject: isConnectedUser ? "Your" : `${humanAddress(address ?? "", 4, 3)}`,
              })}
              buttonText={t("Explore allocations")}
              illustration={<VoteBoxIcon color="rgba(117, 117, 117, 1)" />}
              buttonIcon={FaChartPie}
              onClick={onExploreGovernance}
            />
          )}
        </>
      )
    case ListView.CREATED:
      return <PaginatedProposals proposals={createdProposals ?? []} goBack={onGoBack} />
    case ListView.VOTED:
      return <PaginatedProposals proposals={votedProposalsWithDescription ?? []} goBack={onGoBack} />
    case ListView.APPS_VOTED:
      return <PaginatedTopVotedApps topVotedApps={topVotedApps ?? []} goBack={onGoBack} />
  }
}
