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
    <HStack spacing={2} w={width} justify="start">
      {steps.map((step, index) => (
        <Box
          key={`${step.key}`}
          w="20%"
          h="4px"
          bg={index <= activeStep ? "primary.500" : "gray.200"}
          borderRadius="full"
          transition="background 0.3s"
        />
      ))}
    </HStack>
  )
}
