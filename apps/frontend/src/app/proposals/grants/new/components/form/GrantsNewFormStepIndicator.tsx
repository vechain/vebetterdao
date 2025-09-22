import { Steps, Icon, useMediaQuery, Flex } from "@chakra-ui/react"
import { FaCheck, FaChevronRight } from "react-icons/fa6"

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
      <Steps.Root
        variant="grants"
        step={activeStep}
        count={steps.length}
        display="flex"
        overflowX="hidden"
        w="full"
        maxW="80vw"
        gap={{ base: 2, md: 4 }}>
        <Steps.List gap={{ base: 2, md: 4 }} py={2}>
          {steps.map((step, index) => {
            const isActiveStep = activeStep === index
            const showStepTitle = (isMobile && isActiveStep) || !isMobile

            return (
              <Steps.Item key={step.key} index={index}>
                <Steps.Indicator boxSize={6}>
                  <Steps.Status complete={<Icon as={FaCheck} boxSize={4} />} incomplete={<Steps.Number />} />
                </Steps.Indicator>

                {showStepTitle && (
                  <Steps.Title
                    textStyle={{ base: "sm", md: "sm" }}
                    color={index === activeStep ? "text.default" : "text.subtle"}
                    fontWeight={index === activeStep ? "semibold" : "normal"}>
                    {step.title}
                  </Steps.Title>
                )}

                {index < steps.length - 1 && (
                  <Steps.Separator
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    flex="1"
                    minW={{ base: "20px", md: "40px" }}
                    _before={{ display: "none" }}
                    _after={{ display: "none" }}
                    borderWidth="0"
                    height="auto"
                    bg="transparent"
                    boxSize={6}>
                    <Icon as={FaChevronRight} boxSize={4} color="icon.subtle" />
                  </Steps.Separator>
                )}
              </Steps.Item>
            )
          })}
        </Steps.List>
      </Steps.Root>
    </Flex>
  )
}
