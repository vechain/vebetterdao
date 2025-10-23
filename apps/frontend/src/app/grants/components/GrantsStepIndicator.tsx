import { Box, HStack } from "@chakra-ui/react"

import { Step } from "./GrantsStepCard"

export const GrantsStepIndicator = ({
  activeStep,
  steps,
  width = "full",
}: {
  activeStep: number
  steps: Step[]
  width?: string
}) => {
  return (
    <HStack gap={2} w={width} justify="center">
      {steps.map((step, index) => (
        <Box
          key={`${step.key}`}
          w="20%"
          h="4px"
          bg={index === activeStep ? "actions.primary.default" : "actions.secondary.default"}
          borderRadius="full"
          transition="background 0.3s"
        />
      ))}
    </HStack>
  )
}
