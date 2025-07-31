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
      <Stepper index={activeStep} variant="grants" display="flex" flexWrap="nowrap" gap={isMobile ? 4 : 8}>
        {steps.map((step, index) => {
          const isActiveStep = activeStep === index
          const showStepTitle = (isMobile && isActiveStep) || !isMobile

          return (
            <Flex key={step.key} align="center" flexShrink={0}>
              <Step>
                <StepIndicator flexShrink={0}>
                  <StepStatus
                    complete={<Icon as={BsCheck} boxSize={4} />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                  />
                </StepIndicator>

                {showStepTitle && (
                  <StepTitle
                    fontSize={{ base: "sm", md: "sm" }}
                    isTruncated
                    noOfLines={1}
                    maxWidth={isMobile ? "120px" : "auto"}>
                    {step.title}
                  </StepTitle>
                )}
              </Step>

              {index < steps.length - 1 && (
                <Icon
                  as={BsChevronRight}
                  boxSize={4}
                  ml={2}
                  color={index < activeStep ? "blue.500" : "gray.400"}
                  flexShrink={0}
                />
              )}
            </Flex>
          )
        })}
      </Stepper>
    </Flex>
  )
}
