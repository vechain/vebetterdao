import { Alert, AlertTitle, Card, CardBody, Divider, Heading, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { ProposalQuorumStatus } from "./components/ProposalQuorumStatus"
import { ProposalSessionVot3 } from "./components/ProposalSessionVot3"
import { UseQueryResult } from "@tanstack/react-query"
import { useMemo } from "react"
import { UilClock } from "@iconscout/react-unicons"

type Props = {
  quorumQuery: UseQueryResult<string, Error>
  currentVotesQuery: UseQueryResult<string, Error>
  votesAtSnapshotQuery: UseQueryResult<string, Error>
  userVotesAtSnapshotQuery: UseQueryResult<string, Error>
  isEnded?: boolean
  renderTimeline?: React.ReactNode
}

export const ProposalSessionSection = ({
  quorumQuery,
  currentVotesQuery,
  votesAtSnapshotQuery,
  userVotesAtSnapshotQuery,
  renderTimeline,
  isEnded = false,
}: Props) => {
  const { t } = useTranslation()

  const isUpcoming = useMemo(() => {
    return !isEnded && !quorumQuery.isLoading && !quorumQuery.data
  }, [quorumQuery, isEnded])
  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Session information")}
          </Heading>
          {isUpcoming ? (
            <Alert status="error" borderRadius="16px" bg="#FFF3E5">
              <UilClock size={"36px"} color="#F29B32" />
              <AlertTitle color="#F29B32" ml={2} fontSize="14px">
                {t("Quorum information will be available once the round starts.")}
              </AlertTitle>
            </Alert>
          ) : (
            <>
              <ProposalQuorumStatus currentVotesQuery={currentVotesQuery} quorumQuery={quorumQuery} isEnded={isEnded} />
              <Divider />
              <ProposalSessionVot3
                userVotesAtSnapshotQuery={userVotesAtSnapshotQuery}
                votesAtSnapshotQuery={votesAtSnapshotQuery}
              />
            </>
          )}

          {renderTimeline}
        </VStack>
      </CardBody>
    </Card>
  )
}
