import { Button, Icon, VStack, Card } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { t } from "i18next"
import { useRouter } from "next/navigation"
import { useCallback, useMemo, useState } from "react"
import { FaScaleBalanced, FaChartPie } from "react-icons/fa6"

import { useUserProposalsVoteEvents } from "../../../../api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { useUserVotedProposals } from "../../../../api/contracts/governance/hooks/useUserVotedProposals"
import { useUserTopVotedApps } from "../../../../api/contracts/xApps/hooks/useUserTopVotedApps"
import { VoteBoxIcon } from "../../../../components/VoteBoxIcon"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../../constants/AnalyticsEvents"
import { useUserCreatedProposal } from "../../../../hooks/proposals/common/useUserCreatedProposal"
import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"
import { useRetrieveProfilIdentity } from "../utils/useRetrieveProfilIdentity"

import { EmptyStateGovernance } from "./components/EmptyStateGovernance"
import { PaginatedProposals } from "./components/PaginatedProposals"
import { PaginatedTopVotedApps } from "./components/PaginatedTopVotedApps"
import { PreviewCreatedProposals } from "./components/PreviewCreatedProposals"
import { TopVotedApps } from "./components/TopVotedApps"
import { CurrentDelegation } from "./components/delegation/CurrentDelegation/CurrentDelegation"
import { PendingDelegationDelegateePOV } from "./components/delegation/PendingDelegationDelegateePOV/PendingDelegationDelegateePOV"
import { VotingQualification } from "./components/delegation/VotingQualification/VotingQualification"

import { EmptyState } from "@/components/ui/empty-state"
import HandPlantIcon from "@/components/Icons/svg/hand-plant.svg"

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
  const { account } = useWallet()
  const profileWalletAddress = address ?? account?.address ?? ""

  const { data: createdProposals } = useUserCreatedProposal(profileWalletAddress)
  const { data: votedProposals } = useUserProposalsVoteEvents(profileWalletAddress)

  const { isConnectedUser } = useRetrieveProfilIdentity()

  const router = useRouter()

  const votedProposalsIds = useMemo(() => votedProposals?.map(proposal => proposal.proposalId), [votedProposals])

  const votedProposalsWithDescription = useUserVotedProposals(votedProposalsIds)

  const topVotedApps = useUserTopVotedApps(profileWalletAddress)

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
        <VStack gap="8" w="full">
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
            <Card.Root variant="primary" w="full">
              <Card.Title textStyle="xl">{t("Voted Proposals")}</Card.Title>
              <Card.Body asChild>
                <EmptyState
                  title={t("Voted Proposals")}
                  description={t("{{subject}} voted proposals will appear here.", {
                    subject: isConnectedUser ? "Your" : `${humanAddress(address ?? "", 4, 3)}`,
                  })}
                  icon={
                    <Icon boxSize={20} color="actions.secondary.text-lighter">
                      <HandPlantIcon color="rgba(117, 117, 117, 1)" />
                    </Icon>
                  }>
                  <Button rounded={"full"} variant={"primary"} onClick={() => router.push("/apps")}>
                    <Icon color="actions.secondary.text-lighter">
                      <FaScaleBalanced />
                    </Icon>
                    {t("Explore governance")}
                  </Button>
                </EmptyState>
              </Card.Body>
            </Card.Root>
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
