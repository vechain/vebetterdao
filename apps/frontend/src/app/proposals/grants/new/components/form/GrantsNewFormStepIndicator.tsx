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
                <Steps.Indicator>
                  <Steps.Status complete={<Icon as={BsCheck} boxSize={5} />} incomplete={<Steps.Number />} />
                </Steps.Indicator>

                {showStepTitle && <Steps.Title fontSize={{ base: "sm", md: "sm" }}>{step.title}</Steps.Title>}

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
                    bg="transparent">
                    <Icon as={BsChevronRight} boxSize={4} color={index < activeStep ? "blue.500" : "gray.400"} />
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
