import {
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepNumber,
  StepTitle,
  Icon,
  useMediaQuery,
  Flex,
} from "@chakra-ui/react"
import { BsCheck, BsChevronRight } from "react-icons/bs"
import { GrantStep } from "./GrantsNewFormStepCard"

export const GrantsNewFormStepIndicator = ({ activeStep, steps }: { activeStep: number; steps: GrantStep[] }) => {
  const [isMobile] = useMediaQuery("(max-width: 768px)")

  return (
    <Flex
      overflowX="auto"
      overflowY="hidden"
      whiteSpace="nowrap"
      sx={{
        "&::-webkit-scrollbar": { display: "none" },
        "-ms-overflow-style": "none",
        "scrollbar-width": "none",
      }}>
      <Stepper index={activeStep} variant="grants" display="flex" overflowX="hidden" w="full" maxW="80vw">
        {steps.map((step, index) => {
          const isActiveStep = activeStep === index
          const showStepTitle = (isMobile && isActiveStep) || !isMobile

          return (
            <Flex key={step.key} align="center">
              <Step>
                <StepIndicator>
                  <StepStatus
                    complete={<Icon as={BsCheck} boxSize={7} />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                  />
                </StepIndicator>

                {showStepTitle && (
                  <StepTitle fontSize={{ base: "sm", md: "sm" }} isTruncated noOfLines={1}>
                    {step.title}
                  </StepTitle>
                )}
              </Step>

              {index < steps.length - 1 && (
                <Icon
                  as={BsChevronRight}
                  boxSize={4}
                  mx={{ base: 2, md: 4 }}
                  color={index < activeStep ? "blue.500" : "gray.400"}
                />
              )}
            </Flex>
          )
        })}
      </Stepper>
    </Flex>
  )
}
