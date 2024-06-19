import {
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
  useSteps,
} from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useEffect, useMemo } from "react"

type Props = {
  roundId: string
}

export const AllocationRoundSessionInfoCard = ({ roundId }: Props) => {
  const { account } = useWallet()
  const { data: roundInfo } = useAllocationsRound(roundId)
  const currentVotesQuery = useAllocationVotes(roundId)
  const quorumQuery = useAllocationRoundQuorum(roundId)
  const votesAtSnapshotQuery = useVot3PastSupply(roundInfo.voteStart)
  const userVotesAtSnapshotQuery = useGetVotesOnBlock(Number(roundInfo.voteStart), account ?? "")

  const isRoundActive = useMemo(() => {
    return roundInfo?.state === 0
  }, [roundInfo?.state])

  return (
    <ProposalSessionSection
      quorumQuery={quorumQuery}
      votesAtSnapshotQuery={votesAtSnapshotQuery}
      currentVotesQuery={currentVotesQuery}
      userVotesAtSnapshotQuery={userVotesAtSnapshotQuery}
      isEnded={!isRoundActive}
      renderTimeline={<AllocationRoundTimeline roundId={roundId} />}
    />
  )
}

const AllocationRoundTimeline = ({ roundId }: Props) => {
  const { data: roundInfo } = useAllocationsRound(roundId)
  const steps = useMemo(
    () => [
      { title: "Voting session started", description: roundInfo?.voteStartTimestamp?.format("MMMM D hh:mm A") },
      { title: "Voting session finished", description: roundInfo?.voteEndTimestamp?.format("MMMM D hh:mm A") },
      {
        title: "Voting rewards are claimable",
        description: "",
      },
    ],
    [roundInfo],
  )

  const { activeStep, setActiveStep } = useSteps({
    index: 1,
    count: steps.length,
  })

  useEffect(() => {
    if (roundInfo) {
      const stateNumber = Number(roundInfo.state)
      switch (stateNumber) {
        case 0:
          setActiveStep(1)
          break
        case 1:
          setActiveStep(3)
          break
        case 2:
          setActiveStep(3)
          break
      }
    }
  }, [roundInfo, setActiveStep])

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
      {steps.map((step, index) => (
        <Step key={index}>
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
