import {
  useAllocationRoundQuorum,
  useAllocationVotes,
  useAllocationsRound,
  useTotalVotesOnBlock,
  useVot3PastSupply,
} from "@/api"
import { ProposalSessionSection } from "@/components/ProposalSessionSection"
import { Box, Circle, Steps } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { t } from "i18next"
import { useEffect, useMemo, useState } from "react"
import { v4 as uuid } from "uuid"

type Props = {
  roundId: string
}

export const AllocationRoundSessionInfoCard = ({ roundId }: Props) => {
  const { account } = useWallet()
  const { data: roundInfo } = useAllocationsRound(roundId)
  const currentVotesQuery = useAllocationVotes(roundId)
  const quorumQuery = useAllocationRoundQuorum(roundId)
  const votesAtSnapshotQuery = useVot3PastSupply(roundInfo.voteStart)
  const totalVotesAtSnapshot = useTotalVotesOnBlock(
    roundInfo.voteStart ? Number(roundInfo.voteStart) : undefined,
    account?.address ?? "",
  )

  const isRoundActive = useMemo(() => {
    return roundInfo?.state === 0
  }, [roundInfo?.state])

  const isUpcoming = useMemo(() => {
    return !isRoundActive && !quorumQuery.isLoading && !quorumQuery.data
  }, [quorumQuery, isRoundActive])

  return (
    <ProposalSessionSection
      quorumQuery={quorumQuery}
      votesAtSnapshotQuery={votesAtSnapshotQuery}
      currentVotesQuery={currentVotesQuery}
      userVotesAtSnapshotQuery={totalVotesAtSnapshot}
      renderQuroum={isUpcoming ? "upcoming" : "active"}
      isEnded={!isRoundActive}
      showQuorumNeeded={false}
      renderTimeline={<AllocationRoundTimeline roundId={roundId} />}
    />
  )
}

const AllocationRoundTimeline = ({ roundId }: Props) => {
  const { data: roundInfo } = useAllocationsRound(roundId)

  const [step, setStep] = useState(1)

  useEffect(() => {
    const stateNumber = Number(roundInfo.state)

    if (stateNumber === 0) {
      setStep(1)
    } else if (stateNumber === 1 || stateNumber === 2) {
      setStep(3)
    } else {
      setStep(0)
    }
  }, [roundInfo.state])

  const steps = useMemo(
    () => [
      {
        title: step > 1 ? t("Voting session started") : t("Voting session starts"),
        description: roundInfo?.voteStartTimestamp?.format("MMMM D hh:mm A"),
      },
      {
        title: step > 2 ? t("Voting session ended") : t("Voting session ends"),
        description: roundInfo?.voteEndTimestamp?.format("MMMM D hh:mm A"),
      },
      {
        title: t("Voting rewards are claimable"),
        description: "",
      },
    ],
    [roundInfo, step],
  )

  return (
    <Steps.Root
      size="xs"
      step={step}
      count={steps.length}
      orientation="vertical"
      colorPalette="primary"
      gap="0"
      height="200px"
      mt={4}
      variant="primaryVertical">
      <Steps.List>
        {steps.map((step, index) => (
          <Steps.Item key={`allocation-round-session-step-${uuid()}`} index={index}>
            <Steps.Indicator>
              <Steps.Status
                incomplete={<Circle bg="actions.primary.default" size="0" />}
                complete={<Circle bg="actions.primary.default" size="2" />}
                current={<Circle bg="actions.primary.default" size="3" />}
              />
            </Steps.Indicator>

            <Box flexShrink="0">
              <Steps.Title>{step.title}</Steps.Title>
              <Steps.Description>{step.description}</Steps.Description>
            </Box>

            <Steps.Separator />
          </Steps.Item>
        ))}
      </Steps.List>
    </Steps.Root>
  )
}
