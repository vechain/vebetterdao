import { useAllocationsRound } from "@/api"
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from "@chakra-ui/react"
import { useEffect, useMemo } from "react"

type Props = {
  roundId: string
}

export const AllocationRoundTimeline = ({ roundId }: Props) => {
  const { data: roundInfo } = useAllocationsRound(roundId)

  const steps = useMemo(
    () => [
      { title: "Voting session started", description: roundInfo?.voteStartTimestamp?.format("MMMM D hh:mm A") },
      { title: "Voting session finished", description: roundInfo?.voteEndTimestamp?.format("MMMM D hh:mm A") },
      { title: "Proposal executed", description: "Select Rooms" },
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
      if (stateNumber > 1) setActiveStep(2)
      setActiveStep(stateNumber)
    }
  }, [roundInfo, setActiveStep])

  return (
    <Card w="full">
      <CardHeader>
        <Heading size="md">Timeline</Heading>
      </CardHeader>
      <CardBody>
        <Stepper index={activeStep} orientation="vertical" gap="0" height="200px">
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
      </CardBody>
    </Card>
  )
}
