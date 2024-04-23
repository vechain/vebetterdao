import { DotSymbol } from "@/components"
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
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  useSteps,
} from "@chakra-ui/react"

type CreateProposalStep = {
  key: string
  title: string
  description?: string
}

const steps: CreateProposalStep[] = [
  { key: "creationMethod", title: "Creation method" },
  { key: "basicInfoAndFunctions", title: "Basic information and functions" },
  { key: "additionalInfo", title: "Additional information" },
  { key: "votingSessionDate", title: "Voting session date" },
  { key: "previewAndPublish", title: "Preview and publish" },
]
export const CreateProposalStepperCard = () => {
  const { activeStep, setActiveStep } = useSteps({
    index: 1,
    count: steps.length,
  })

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Progress</Heading>
      </CardHeader>
      <CardBody>
        <Stepper
          size="sm"
          index={activeStep}
          orientation="vertical"
          colorScheme="primary"
          gap="0"
          height="300px"
          mt={4}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepIndicator>
                <StepStatus
                  complete={<StepIcon />}
                  incomplete={<></>}
                  active={<DotSymbol color="primary.500" size={3} />}
                />
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
