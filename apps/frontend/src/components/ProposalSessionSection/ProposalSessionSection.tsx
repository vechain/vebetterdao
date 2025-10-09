import { Alert, Card, Separator, Heading, VStack } from "@chakra-ui/react"
import { UilClock } from "@iconscout/react-unicons"
import { UseQueryResult } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { ProposalSessionVot3 } from "./components/ProposalSessionVot3/ProposalSessionVot3"
import { ProposalQuorumStatus } from "./components/ProposalQuorumStatus/ProposalQuorumStatus"

type Props = {
  quorumQuery: UseQueryResult<string, unknown>
  currentVotesQuery: UseQueryResult<string, unknown>
  votesAtSnapshotQuery: UseQueryResult<string, unknown>
  userVotesAtSnapshotQuery: UseQueryResult<
    | {
        totalVotesWithDeposits: string // total votes
        depositsVotes: string // deposit votes if any
      }
    | string,
    unknown
  >
  renderQuroum?: "none" | "upcoming" | "active"
  isEnded?: boolean
  renderTimeline?: React.ReactNode
  showQuorumNeeded?: boolean
}
export const ProposalSessionSection = ({
  quorumQuery,
  currentVotesQuery,
  votesAtSnapshotQuery,
  userVotesAtSnapshotQuery,
  renderTimeline,
  isEnded = false,
  renderQuroum = "active",
  showQuorumNeeded = true,
}: Props) => {
  const { t } = useTranslation()
  return (
    <Card.Root variant="primary">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <Heading size="xl">{t("Session information")}</Heading>
          {renderQuroum === "upcoming" ? (
            <Alert.Root status="error" borderRadius="16px" bg="#FFF3E5">
              <Alert.Indicator>
                <UilClock size={"36px"} color="status.positive.primary" />
              </Alert.Indicator>
              <Alert.Title color="status.positive.primary" ml={2} textStyle="sm">
                {t("Quorum information will be available once the round starts.")}
              </Alert.Title>
            </Alert.Root>
          ) : (
            renderQuroum === "active" && (
              <>
                <ProposalQuorumStatus
                  currentVotesQuery={currentVotesQuery}
                  quorumQuery={quorumQuery}
                  isEnded={isEnded}
                  showQuorumNeeded={showQuorumNeeded}
                />
                <Separator />
                <ProposalSessionVot3
                  userVotesAtSnapshotQuery={userVotesAtSnapshotQuery}
                  votesAtSnapshotQuery={votesAtSnapshotQuery}
                />
              </>
            )
          )}

          {renderTimeline}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
