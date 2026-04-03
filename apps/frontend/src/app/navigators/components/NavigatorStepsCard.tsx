import { Box, Button, Card, Flex, Heading, HStack, Icon, List, Steps, Text, VStack } from "@chakra-ui/react"
import { UilArrowLeft, UilTimes } from "@iconscout/react-unicons"
import { motion, AnimatePresence, useAnimate } from "framer-motion"
import { useCallback, useState } from "react"
import { BsCheck } from "react-icons/bs"
import { LuSearch, LuShield, LuStar, LuVote } from "react-icons/lu"

import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { useBreakpoints } from "@/hooks/useBreakpoints"

type Step = {
  key: string
  title: string
  icon: React.ElementType
  heading: string
  listItems: string[]
}

const STEPS: Step[] = [
  {
    key: "browse",
    title: "How does delegation work?",
    icon: LuSearch,
    heading: "1. Browse Navigators",
    listItems: [
      "Navigators are professional voters who stake B3TR to vote on your behalf.",
      "Review their motivation, qualifications, voting strategy, and track record before delegating.",
    ],
  },
  {
    key: "delegate",
    title: "How does delegation work?",
    icon: LuVote,
    heading: "2. Delegate your VOT3",
    listItems: [
      "Choose how much VOT3 to delegate. Your tokens stay in your wallet — only the delegated portion is locked.",
      "You can increase or decrease your delegation at any time. Changes take effect next round.",
    ],
  },
  {
    key: "earn",
    title: "How does delegation work?",
    icon: LuStar,
    heading: "3. Earn rewards passively",
    listItems: [
      "The navigator votes on allocation rounds and governance proposals for you.",
      "Your rewards are proportional to your delegated amount. A 20% navigator fee is deducted automatically.",
    ],
  },
  {
    key: "manage",
    title: "How does delegation work?",
    icon: LuShield,
    heading: "4. Stay in control",
    listItems: [
      "You can undelegate fully or partially at any time.",
      "If a navigator exits or is deactivated, your VOT3 is automatically unlocked — no action needed.",
    ],
  },
]

const StepIndicator = ({ activeStep, count }: { activeStep: number; count: number }) => (
  <HStack gap={2} w="full" justify="center">
    {Array.from({ length: count }).map((_, index) => (
      <Box
        key={index}
        w="20%"
        h="4px"
        bg={index === activeStep ? "actions.primary.default" : "actions.secondary.default"}
        borderRadius="full"
        transition="background 0.3s"
      />
    ))}
  </HStack>
)

export const NavigatorStepsCard = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { isMobile } = useBreakpoints()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [scope, animate] = useAnimate()

  const goToNext = useCallback(() => {
    if (currentStepIndex === 0 && !isMobile) {
      animate(scope.current, { width: "32" }, { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] })
    }
    setCurrentStepIndex(prev => prev + 1)
  }, [currentStepIndex, isMobile, animate, scope])

  const goToPrevious = useCallback(() => {
    setCurrentStepIndex(prev => prev - 1)
    if (currentStepIndex === 1 && !isMobile) {
      animate(scope.current, { width: "160px" }, { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] })
    }
  }, [currentStepIndex, isMobile, animate, scope])

  const currentStep = STEPS[currentStepIndex]
  const isLastStep = currentStepIndex === STEPS.length - 1

  const handleNext = useCallback(() => {
    if (isLastStep) {
      onClose()
    } else {
      goToNext()
    }
  }, [isLastStep, onClose, goToNext])

  if (!currentStep) return null

  if (isMobile) {
    return (
      <BaseBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        ariaTitle={currentStep.title}
        ariaDescription={currentStep.heading}
        height="100%">
        <Steps.Root step={currentStepIndex} count={STEPS.length} size="sm">
          <HStack w="full" justify="space-between" alignItems="center">
            {currentStepIndex > 0 && <UilArrowLeft onClick={goToPrevious} cursor="pointer" />}
            <StepIndicator activeStep={currentStepIndex} count={STEPS.length} />
            <UilTimes onClick={onClose} cursor="pointer" size={24} />
          </HStack>
          <Box pt={5}>
            <VStack w="full" textAlign="center" gap={4}>
              <Heading size="md">{currentStep.title}</Heading>
              <Icon as={currentStep.icon} boxSize={16} color="actions.primary.default" />
              <Heading size="sm">{currentStep.heading}</Heading>
              <List.Root variant="plain" pl={5} textStyle="sm" gap={2} textAlign="left">
                {currentStep.listItems.map((item, index) => (
                  <List.Item key={`${item}-${index}`} color="text.subtle">
                    <List.Indicator asChild>
                      <Icon boxSize="6" as={BsCheck} color="icon.default" />
                    </List.Indicator>
                    {item}
                  </List.Item>
                ))}
              </List.Root>
              <HStack w="full" justifyContent="flex-start" pt={5}>
                <Button variant="primary" w="full" onClick={handleNext}>
                  {isLastStep ? "Got it" : "Next"}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Steps.Root>
      </BaseBottomSheet>
    )
  }

  return (
    <Card.Root
      variant="primary"
      display={isOpen ? "block" : "none"}
      w="full"
      h="full"
      borderRadius="xl"
      overflow="hidden">
      <Steps.Root step={currentStepIndex} count={STEPS.length}>
        <Flex h="full">
          <Box flex="1">
            <Box pl={8} pt={8} pb={4} w={{ base: "100%", lg: "35%" }}>
              <StepIndicator activeStep={currentStepIndex} count={STEPS.length} />
            </Box>
            <VStack gap={10} alignItems="flex-start" w="full" p={10}>
              <VStack alignItems="flex-start" w="full">
                <Text textStyle="sm" fontWeight="bold" color="text.subtle">
                  {currentStep.title}
                </Text>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key={currentStep.key}
                  style={{ width: "100%" }}>
                  <VStack alignItems="flex-start" w="full">
                    <Heading size="xl">{currentStep.heading}</Heading>
                    <List.Root pl={2} textStyle="sm" listStyle="disc">
                      {currentStep.listItems.map(item => (
                        <List.Item key={item} color="text.subtle">
                          {item}
                        </List.Item>
                      ))}
                    </List.Root>
                  </VStack>
                </motion.div>
              </VStack>
              <HStack w="full" justify="flex-start" maxW={{ md: currentStepIndex > 0 ? "100%" : "200px" }}>
                <AnimatePresence>
                  {currentStepIndex > 0 && (
                    <motion.div
                      key="previous-button"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.4, ease: [0.25, 0.25, 0.25, 0.2] }}>
                      <Button variant="secondary" w="32" onClick={goToPrevious}>
                        {"Back"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button ref={scope} variant="primary" onClick={handleNext} w="32">
                  {isLastStep ? "Got it" : "Next"}
                </Button>
              </HStack>
            </VStack>
          </Box>

          <Box
            bg="b3tr-balance-bg"
            w="32%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            position="relative">
            <Box position="absolute" top={3} right={5} p={0}>
              <UilTimes onClick={onClose} cursor="pointer" size={24} />
            </Box>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              key={currentStep.key}>
              <Icon as={currentStep.icon} boxSize={32} color="actions.primary.default" opacity={0.3} />
            </motion.div>
          </Box>
        </Flex>
      </Steps.Root>
    </Card.Root>
  )
}
