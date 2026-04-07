import { Card, Heading, Icon, VStack } from "@chakra-ui/react"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useUserProposalsVoteEvents } from "@/api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { useUserVotedProposals } from "@/api/contracts/governance/hooks/useUserVotedProposals"
import { useUserTopVotedApps } from "@/api/contracts/xApps/hooks/useUserTopVotedApps"
import { PaginatedProposals } from "@/app/profile/components/ProfileGovernance/components/PaginatedProposals"
import { PaginatedTopVotedApps } from "@/app/profile/components/ProfileGovernance/components/PaginatedTopVotedApps"
import { PreviewCreatedProposals } from "@/app/profile/components/ProfileGovernance/components/PreviewCreatedProposals"
import { TopVotedApps } from "@/app/profile/components/ProfileGovernance/components/TopVotedApps"
import HandPlantIcon from "@/components/Icons/svg/hand-plant.svg"
import { EmptyState } from "@/components/ui/empty-state"
import { useUserCreatedProposal } from "@/hooks/proposals/common/useUserCreatedProposal"

enum ListView {
  ALL,
  CREATED,
  VOTED,
  APPS_VOTED,
}

type Props = {
  address: string
}

export const NavigatorGovernanceActivity = ({ address }: Props) => {
  const { t } = useTranslation()
  const { data: createdProposals } = useUserCreatedProposal(address)
  const { data: votedProposals } = useUserProposalsVoteEvents(address)
  const votedProposalsIds = useMemo(() => votedProposals?.map(p => p.proposalId.toString()), [votedProposals])
  const votedProposalsWithDescription = useUserVotedProposals(votedProposalsIds)
  const topVotedApps = useUserTopVotedApps(address)

  const [listView, setListView] = useState<ListView>(ListView.ALL)

  const onGoBack = useCallback(() => setListView(ListView.ALL), [])

  switch (listView) {
    case ListView.ALL:
      return (
        <VStack gap={8} w="full">
          {createdProposals && createdProposals.length > 0 && (
            <PreviewCreatedProposals
              firstProposals={createdProposals}
              isCreatedProposals
              onSeeAllProposals={() => setListView(ListView.CREATED)}
            />
          )}

          {votedProposalsWithDescription && votedProposalsWithDescription.length > 0 ? (
            <PreviewCreatedProposals
              firstProposals={votedProposalsWithDescription}
              isMoreProposals={isMoreVotedProposals}
              onSeeAllProposals={() => setListView(ListView.VOTED)}
            />
          ) : (
            <Card.Root variant="primary" w="full">
              <Heading size={{ base: "lg", md: "xl" }} fontWeight={"bold"}>
                {t("Voted Proposals")}
              </Heading>
              <Card.Body asChild>
                <EmptyState
                  title={t("Voted Proposals")}
                  description={t("{{subject}} voted proposals will appear here.", {
                    subject: `${humanAddress(address, 4, 3)}`,
                  })}
                  icon={
                    <Icon boxSize={20} color="actions.secondary.text-lighter">
                      <HandPlantIcon color="rgba(117, 117, 117, 1)" />
                    </Icon>
                  }
                />
              </Card.Body>
            </Card.Root>
          )}

          {topVotedApps && topVotedApps.length > 0 ? (
            <TopVotedApps votedApps={topVotedApps} onSeeAllAppsVoted={() => setListView(ListView.APPS_VOTED)} />
          ) : (
            <Card.Root variant="primary" w="full">
              <Card.Title textStyle="xl">{t("Most voted apps")}</Card.Title>
              <Card.Body asChild>
                <EmptyState
                  title={t("Most voted apps")}
                  description={t("{{subject}} top voted apps will appear here.", {
                    subject: `${humanAddress(address, 4, 3)}`,
                  })}
                  icon={
                    <Icon boxSize={20} color="actions.secondary.text-lighter">
                      <HandPlantIcon color="rgba(117, 117, 117, 1)" />
                    </Icon>
                  }
                />
              </Card.Body>
            </Card.Root>
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
