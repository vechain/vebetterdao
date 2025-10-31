import { Box, Button, Card, Flex, HStack, Input, Text, VStack } from "@chakra-ui/react"
import { LuZap } from "react-icons/lu"

import {
  OnboardingHighlight,
  OnboardingOverlay,
  OnboardingProvider,
  OnboardingTooltip,
  useOnboarding,
  type OnboardingStep,
} from "../components/onboarding"

export default {
  title: "Components/Onboarding",
}

const steps: OnboardingStep[] = [
  {
    id: "search",
    title: "Search for apps",
    description: "Use the search bar to find apps you want to vote for",
    targetId: "search-input",
    placement: "bottom",
  },
  {
    id: "power-up",
    title: "Get voting power",
    description: "Turn B3TR into VOT3 tokens for be able to vote",
    targetId: "power-up-button",
    placement: "bottom",
  },
  {
    id: "vote",
    title: "Vote for apps",
    description: "Select apps and cast your vote to earn rewards",
    targetId: "app-list",
    placement: "top",
  },
]

const OnboardingDemo = () => {
  const { isActive, currentStepIndex, steps: allSteps, nextStep, prevStep, getCurrentStep } = useOnboarding()
  const currentStep = getCurrentStep()

  return (
    <Box minH="100vh" bg="bg.secondary" p={6}>
      <OnboardingOverlay isVisible={isActive} />

      <VStack gap={4} maxW="400px" mx="auto">
        <OnboardingTooltip
          isOpen={isActive && currentStep?.targetId === "power-up-button"}
          title={currentStep?.title || ""}
          description={currentStep?.description || ""}
          currentStep={currentStepIndex + 1}
          totalSteps={allSteps.length}
          onNext={nextStep}
          onPrev={prevStep}
          showPrev={currentStepIndex > 0}
          placement={currentStep?.placement}>
          <Card.Root w="full">
            <Card.Body p={4}>
              <VStack gap={4} align="stretch">
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text textStyle="xs" color="text.subtle">
                      Voting Power
                    </Text>
                    <Text textStyle="lg" fontWeight="semibold" color="text.default">
                      0
                    </Text>
                  </Box>
                  <Button size="sm" colorPalette="blue">
                    <LuZap />
                    Power up
                  </Button>
                </Flex>
              </VStack>
            </Card.Body>
          </Card.Root>
        </OnboardingTooltip>

        <VStack gap={2} w="full" align="stretch">
          <Text textStyle="lg" fontWeight="semibold">
            Vote for apps
          </Text>
          <OnboardingTooltip
            isOpen={isActive && currentStep?.targetId === "search-input"}
            title={currentStep?.title || ""}
            description={currentStep?.description || ""}
            currentStep={currentStepIndex + 1}
            totalSteps={allSteps.length}
            onNext={nextStep}
            onPrev={prevStep}
            showPrev={currentStepIndex > 0}
            placement={currentStep?.placement}>
            <OnboardingHighlight isActive={isActive && currentStep?.targetId === "search-input"}>
              <Input placeholder="Search" size="md" />
            </OnboardingHighlight>
          </OnboardingTooltip>

          <HStack gap={2}>
            <Button size="sm" variant="outline">
              All
            </Button>
            <Button size="sm" variant="ghost">
              Food & Drinks
            </Button>
            <Button size="sm" variant="ghost">
              Recycling
            </Button>
          </HStack>
        </VStack>

        <OnboardingTooltip
          isOpen={isActive && currentStep?.targetId === "app-list"}
          title={currentStep?.title || ""}
          description={currentStep?.description || ""}
          currentStep={currentStepIndex + 1}
          totalSteps={allSteps.length}
          onNext={nextStep}
          onPrev={prevStep}
          showPrev={currentStepIndex > 0}
          placement={currentStep?.placement}>
          <OnboardingHighlight isActive={isActive && currentStep?.targetId === "app-list"}>
            <VStack gap={3} w="full">
              <Card.Root w="full">
                <Card.Body p={4}>
                  <Flex gap={3} align="center">
                    <Box w={10} h={10} bg="blue.100" borderRadius="md" />
                    <Box flex={1}>
                      <Text fontWeight="semibold">MugShot</Text>
                      <Text textStyle="xs" color="text.subtle">
                        255 votes
                      </Text>
                    </Box>
                    <Text textStyle="sm" fontWeight="semibold">
                      65%
                    </Text>
                  </Flex>
                </Card.Body>
              </Card.Root>

              <Card.Root w="full">
                <Card.Body p={4}>
                  <Flex gap={3} align="center">
                    <Box w={10} h={10} bg="status.positive.subtle" borderRadius="md" />
                    <Box flex={1}>
                      <Text fontWeight="semibold">Green cart</Text>
                      <Text textStyle="xs" color="text.subtle">
                        255 votes
                      </Text>
                    </Box>
                    <Text textStyle="sm" fontWeight="semibold">
                      65%
                    </Text>
                  </Flex>
                </Card.Body>
              </Card.Root>

              <Card.Root w="full">
                <Card.Body p={4}>
                  <Flex gap={3} align="center">
                    <Box w={10} h={10} bg="status.positive.strong" borderRadius="md" />
                    <Box flex={1}>
                      <Text fontWeight="semibold">Cleanify</Text>
                      <Text textStyle="xs" color="text.subtle">
                        255 votes
                      </Text>
                    </Box>
                    <Text textStyle="sm" fontWeight="semibold">
                      65%
                    </Text>
                  </Flex>
                </Card.Body>
              </Card.Root>
            </VStack>
          </OnboardingHighlight>
        </OnboardingTooltip>
      </VStack>
    </Box>
  )
}

export const LightMode = () => {
  return (
    <OnboardingProvider steps={steps} autoStart>
      <OnboardingDemo />
    </OnboardingProvider>
  )
}
