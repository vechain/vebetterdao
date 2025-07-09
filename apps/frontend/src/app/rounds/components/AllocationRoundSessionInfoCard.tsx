import {
  ProposalState,
  useAllocationRoundQuorum,
  useAllocationVotes,
  useAllocationsRound,
  useGetVotesOnBlock,
  useVot3PastSupply,
} from "@/api"
import { ProposalSessionSection } from "@/components/ProposalSessionSection"
import {
  Box,
  Circle,
  Step,
  StepDescription,
  StepIndicator,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { t } from "i18next"
import { useMemo } from "react"
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
  const userVotesAtSnapshotQuery = useGetVotesOnBlock(
    roundInfo.voteStart ? Number(roundInfo.voteStart) : undefined,
    account?.address ?? "",
  )

  const isRoundActive = useMemo(() => {
    return roundInfo?.state === ProposalState.Active
  }, [roundInfo?.state])

  const isUpcoming = useMemo(() => {
    return !isRoundActive && !quorumQuery.isLoading && !quorumQuery.data
  }, [quorumQuery, isRoundActive])

  console.log("isRoundActive", isRoundActive)
  console.log("isUpcoming", isUpcoming)
  console.log("quorumQuery", quorumQuery)

  return (
    <ProposalSessionSection
      quorumQuery={quorumQuery}
      votesAtSnapshotQuery={votesAtSnapshotQuery}
      currentVotesQuery={currentVotesQuery}
      userVotesAtSnapshotQuery={userVotesAtSnapshotQuery}
      renderQuroum={isUpcoming ? "upcoming" : "active"}
      isEnded={!isRoundActive}
      showQuorumNeeded={false}
      renderTimeline={<AllocationRoundTimeline roundId={roundId} />}
    />
  )
}

const AllocationRoundTimeline = ({ roundId }: Props) => {
  const { data: roundInfo } = useAllocationsRound(roundId)

  const activeStep = useMemo(() => {
    const stateNumber = Number(roundInfo.state)
    switch (stateNumber) {
      case 0:
        return 1
      case 1:
        return 3
      case 2:
        return 3
      default:
        return 0
    }
  }, [roundInfo])

  const steps = useMemo(
    () => [
      {
        title: activeStep > 0 ? t("Voting session started") : t("Voting session starts"),
        description: roundInfo?.voteStartTimestamp?.format("MMMM D hh:mm A"),
      },
      {
        title: activeStep > 1 ? t("Voting session ended") : t("Voting session ends"),
        description: roundInfo?.voteEndTimestamp?.format("MMMM D hh:mm A"),
      },
      {
        title: t("Voting rewards are claimable"),
        description: "",
      },
    ],
    [roundInfo, activeStep],
  )

  return (
    <Stepper
      size="sm"
      index={activeStep}
      orientation="vertical"
      colorScheme="primary"
      gap="0"
      height="200px"
      mt={4}
      variant="primaryVertical">
      {steps.map(step => (
        <Step key={`allocation-round-session-step-${uuid()}`}>
          <StepIndicator>
            <StepStatus complete={<Circle bg="#004CFC" size={"30%"} />} active={<Circle bg="#004CFC" size={"60%"} />} />
          </StepIndicator>

          <Box flexShrink="0">
            <StepTitle>{step.title}</StepTitle>
            <StepDescription>{step.description}</StepDescription>
          </Box>

          <StepSeparator />
        </Step>
      ))}
    </Stepper>
  )
}
