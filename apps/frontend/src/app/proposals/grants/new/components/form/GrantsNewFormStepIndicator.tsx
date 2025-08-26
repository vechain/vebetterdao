import { Steps, Icon, useMediaQuery, Flex } from "@chakra-ui/react"
import { BsCheck, BsChevronRight } from "react-icons/bs"
import { GrantStep } from "./GrantsNewFormStepCard"

export const GrantsNewFormStepIndicator = ({ activeStep, steps }: { activeStep: number; steps: GrantStep[] }) => {
  const [isMobile] = useMediaQuery(["(max-width: 768px)"])

  return (
    <Flex
      overflowX="auto"
      overflowY="hidden"
      whiteSpace="nowrap"
      css={{
        "&::-webkit-scrollbar": { display: "none" },
        "-ms-overflow-style": "none",
        "scrollbar-width": "none",
      }}>
      <Steps.Root step={activeStep} count={steps.length} display="flex" overflowX="hidden" w="full" maxW="80vw">
        <Steps.List>
          {steps.map((step, index) => {
            const isActiveStep = activeStep === index
            const showStepTitle = (isMobile && isActiveStep) || !isMobile

            return (
              <Flex key={step.key} align="center">
                <Steps.Item index={index}>
                  <Steps.Indicator>
                    <Steps.Status complete={<Icon as={BsCheck} boxSize={7} />} incomplete={<Steps.Number />} />
                  </Steps.Indicator>

                  {showStepTitle && (
                    <Steps.Title fontSize={{ base: "sm", md: "sm" }} truncate>
                      {step.title}
                    </Steps.Title>
                  )}

                  {index < steps.length - 1 && (
                    <Flex w={"full"} align="center" justify="center" minW={{ base: "10px", md: "24px" }}>
                      <Icon as={BsChevronRight} boxSize={4} color={index < activeStep ? "blue.500" : "gray.400"} />
                    </Flex>
                  )}
                </Steps.Item>
              </Flex>
            )
          })}
        </Steps.List>
      </Steps.Root>
    </Flex>
  )
}
