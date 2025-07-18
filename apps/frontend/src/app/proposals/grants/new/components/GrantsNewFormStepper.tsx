import {
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepNumber,
  StepTitle,
  Box,
  Icon,
  HStack,
  Hide,
} from "@chakra-ui/react"
import { BsCheck, BsChevronRight } from "react-icons/bs"

export type Step = {
  title: string
}

export const GrantsNewFormStepper = ({ activeStep, steps }: { activeStep: number; steps: Step[] }) => {
  return (
    <Stepper index={activeStep} variant="grants">
      {steps.map((step, index) => (
        <HStack key={step.title} w="full" spacing={2} alignItems="center" justifyContent="space-between">
          <Step key={step.title}>
            <StepIndicator>
              <StepStatus
                complete={<Icon as={BsCheck} boxSize={4} />}
                incomplete={<StepNumber />}
                active={<StepNumber />}
              />
            </StepIndicator>

            <Hide below="md">
              <Box flexShrink="0">
                <StepTitle>{step.title}</StepTitle>
              </Box>
            </Hide>
          </Step>
          {index !== steps.length - 1 && (
            <Icon as={BsChevronRight} color="gray.400" boxSize={4} ml={2} flexShrink={0} />
          )}
        </HStack>
      ))}
    </Stepper>
  )
}
