import { VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"

import { useUserProposalsVoteEvents } from "../../../../api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { useUserVotedProposals } from "../../../../api/contracts/governance/hooks/useUserVotedProposals"
import { useUserTopVotedApps } from "../../../../api/contracts/xApps/hooks/useUserTopVotedApps"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../../constants/AnalyticsEvents"
import { useUserCreatedProposal } from "../../../../hooks/proposals/common/useUserCreatedProposal"
import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { useRetrieveProfilIdentity } from "../utils/useRetrieveProfilIdentity"

import { CreatedProposalsSection } from "./components/CreatedProposalsSection"
import { DelegationSection } from "./components/DelegationSection"
import { PaginatedProposals } from "./components/PaginatedProposals"
import { PaginatedTopVotedApps } from "./components/PaginatedTopVotedApps"
import { TopVotedAppsSection } from "./components/TopVotedAppsSection"
import { VotedProposalsSection } from "./components/VotedProposalsSection"

enum ListView {
  ALL,
  CREATED,
  VOTED,
  APPS_VOTED,
}

type Props = {
  address: string
}
export const ProfileGovernance = ({ address }: Props) => {
  const { account } = useWallet()
  const profileWalletAddress = address ?? account?.address ?? ""

  const { isConnectedUser } = useRetrieveProfilIdentity()

  const router = useRouter()

  const [listView, setListView] = useState<ListView>(ListView.ALL)

  // Data hooks for paginated views
  const { data: createdProposals } = useUserCreatedProposal(profileWalletAddress)
  const { data: votedProposals } = useUserProposalsVoteEvents(profileWalletAddress)
  const votedProposalsIds = useMemo(() => votedProposals?.map(proposal => proposal.proposalId), [votedProposals])
  const votedProposalsWithDescription = useUserVotedProposals(votedProposalsIds)
  const topVotedApps = useUserTopVotedApps(profileWalletAddress)

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

  switch (listView) {
    case ListView.ALL:
      return (
        <VStack gap="8" w="full">
          <DelegationSection address={address} isConnectedUser={isConnectedUser} />
          <CreatedProposalsSection address={profileWalletAddress} onSeeAll={onSeeAllCreatedProposals} />
          <VotedProposalsSection
            address={profileWalletAddress}
            isConnectedUser={isConnectedUser}
            onSeeAll={onSeeAllVotedProposals}
            onExploreGovernance={() => router.push("/apps")}
          />
          <TopVotedAppsSection
            address={profileWalletAddress}
            onSeeAll={onSeeAllAppsVoted}
            onExploreGovernance={onExploreGovernance}
          />
        </VStack>
      )
    case ListView.CREATED:
      return <PaginatedProposals proposals={createdProposals ?? []} goBack={onGoBack} />
    case ListView.VOTED:
      return <PaginatedProposals proposals={votedProposalsWithDescription ?? []} goBack={onGoBack} />
    case ListView.APPS_VOTED:
      return <PaginatedTopVotedApps topVotedApps={topVotedApps ?? []} goBack={onGoBack} />
  }
}
