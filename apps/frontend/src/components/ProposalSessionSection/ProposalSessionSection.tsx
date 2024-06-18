import { Card, CardBody, Heading, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProposalQuorumStatus } from "./components/ProposalQuorumStatus"
import { ProposalSessionVot3 } from "./components/ProposalSessionVot3"
import { ProposalTimeline } from "./components/ProposalTimeline"
import { UseQueryResult } from "@tanstack/react-query"

type Props = {
  quorumQuery: UseQueryResult<string, Error>
  currentVotesQuery: UseQueryResult<string, Error>
  votesAtSnapshotQuery: UseQueryResult<string, Error>
  userVotesAtSnapshotQuery: UseQueryResult<string, Error>
  isEnded: boolean
}
export const ProposalSessionSection = ({
  quorumQuery,
  currentVotesQuery,
  votesAtSnapshotQuery,
  userVotesAtSnapshotQuery,
  isEnded,
}: Props) => {
  const { t } = useTranslation()
  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Session information")}
          </Heading>
          <ProposalQuorumStatus currentVotesQuery={currentVotesQuery} quorumQuery={quorumQuery} isEnded={isEnded} />
          <ProposalSessionVot3
            userVotesAtSnapshotQuery={userVotesAtSnapshotQuery}
            votesAtSnapshotQuery={votesAtSnapshotQuery}
          />
          <ProposalTimeline />
        </VStack>
      </CardBody>
    </Card>
  )
}
