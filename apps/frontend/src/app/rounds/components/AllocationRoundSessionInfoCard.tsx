import { useAllocationVotes, useAllocationsRound, useVot3PastSupply } from "@/api"
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Skeleton,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  Text,
  VStack,
  useSteps,
} from "@chakra-ui/react"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useEffect, useMemo } from "react"

type Props = {
  roundId: string
}

export const AllocationRoundSessionInfoCard = ({ roundId }: Props) => {
  const { data: roundInfo } = useAllocationsRound(roundId)
  const { data: votes, isLoading: votesLoading } = useAllocationVotes(roundId)

  const { data: votesAtSnapshot, isLoading: votesAtSnapshotLoading } = useVot3PastSupply(roundInfo.voteStart)

  const steps = useMemo(
    () => [
      { title: "Voting session started", description: roundInfo?.voteStartTimestamp?.format("MMMM D hh:mm A") },
      { title: "Voting session finished", description: roundInfo?.voteEndTimestamp?.format("MMMM D hh:mm A") },
      { title: "Allocations claimable" },
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
      setActiveStep(stateNumber)
    }
  }, [roundInfo, setActiveStep])

  return (
    <Card w="full">
      <CardHeader>
        <Heading size="md">Session info</Heading>
      </CardHeader>
      <CardBody>
        <VStack w="full" justify={"space-between"} spacing={4} align="flex-start">
          <Box>
            <Skeleton isLoaded={!votesLoading}>
              <Heading size="lg">{humanNumber(votes ?? "0", votes)}</Heading>
            </Skeleton>
            <Text fontSize={"sm"} textTransform={"uppercase"}>
              Real-time votes
            </Text>
          </Box>

          <Box>
            <Skeleton isLoaded={!votesAtSnapshotLoading}>
              <Heading size="lg">{humanNumber(votesAtSnapshot ?? "0", votes)}</Heading>
            </Skeleton>
            <Text fontSize={"sm"} textTransform={"uppercase"}>
              Votes at snapshot
            </Text>
          </Box>

          <Stepper index={activeStep} orientation="vertical" gap="0" height="200px" mt={4}>
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator>
                  <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
                </StepIndicator>

                <Box flexShrink="0">
                  <StepTitle>{step.title}</StepTitle>
                  <StepDescription>{step.description}</StepDescription>
                </Box>

                <StepSeparator />
              </Step>
            ))}
          </Stepper>
        </VStack>
      </CardBody>
    </Card>
  )
}
