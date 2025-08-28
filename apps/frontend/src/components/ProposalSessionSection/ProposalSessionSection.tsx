import { Alert, Card, Separator, Heading, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProposalQuorumStatus } from "./components/ProposalQuorumStatus"
import { ProposalSessionVot3 } from "./components/ProposalSessionVot3"
import { UseQueryResult } from "@tanstack/react-query"
import { UilClock } from "@iconscout/react-unicons"

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
    <Card.Root variant="baseWithBorder">
      <Card.Body>
        <VStack align="stretch" gap={6}>
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Session information")}
          </Heading>
          {renderQuroum === "upcoming" ? (
            <Alert.Root status="error" borderRadius="16px" bg="#FFF3E5">
              <Alert.Indicator>
                <UilClock size={"36px"} color="success.primary" />
              </Alert.Indicator>
              <Alert.Title color="success.primary" ml={2} fontSize="14px">
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
