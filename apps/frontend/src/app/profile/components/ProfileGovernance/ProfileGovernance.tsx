import {
  useProposalsCreatedFromIds,
  useUserProposalsCreatedEvents,
  useUserProposalsVoteEvents,
  useUserTopVotedApps,
} from "@/api"
import { useCallback, useMemo, useState } from "react"
import {
  EmptyStateGovernance,
  PaginatedProposals,
  PaginatedTopVotedApps,
  PreviewCreatedProposals,
  TopVotedApps,
} from "./components"
import { useWallet } from "@vechain/dapp-kit-react"
import { FaScaleBalanced, FaChartPie } from "react-icons/fa6"
import { useRouter } from "next/navigation"
import { HandPlantIcon, ProposalIcon, VoteBoxIcon } from "@/components"

enum ListView {
  ALL,
  CREATED,
  VOTED,
  APPS_VOTED,
}

const PREVIEW_SIZE = 3 // The number of proposals to show in the preview

export const ProfileGovernance = () => {
  const { account } = useWallet()
  const { data: createdProposals } = useUserProposalsCreatedEvents(account ?? "")
  const { data: votedProposals } = useUserProposalsVoteEvents(account ?? "")

  const router = useRouter()

  const votedProposalsIds = useMemo(() => votedProposals?.map(proposal => proposal.proposalId), [votedProposals])

  const { created: votedProposalsWithDescription } = useProposalsCreatedFromIds(votedProposalsIds)

  const topVotedApps = useUserTopVotedApps(account ?? "")

  console.log({ votedProposals, votedProposalsWithDescription, topVotedApps })

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
          {isFirstCreatedProposalsAvailable ? (
            <PreviewCreatedProposals
              firstProposals={firstCreatedProposals}
              isMoreProposals={isMoreCreatedProposals}
              isCreatedProposals
              onSeeAllProposals={onSeeAllCreatedProposals}
            />
          ) : (
            <EmptyStateGovernance
              title="Created Proposals"
              description="Your created proposals will appear here."
              buttonText="Explore governance"
              illustration={<ProposalIcon color="rgba(117, 117, 117, 1)" />}
              buttonIcon={FaScaleBalanced}
              onClick={onExploreGovernance}
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
              title="Voted Proposals"
              description="Your voted proposals will appear here."
              buttonText="Explore governance"
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
              title="Your Most Voted Apps"
              description="Your top voted apps will appear here."
              buttonText="Explore allocations"
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
