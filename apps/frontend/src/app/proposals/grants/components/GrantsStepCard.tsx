/* eslint-disable react/no-array-index-key */
import { useMetProposalCriteria } from "@/api/contracts/governance"
import { RequirementModal } from "@/app/proposals/components/components"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { Box, Button, Card, Flex, Heading, HStack, Icon, List, Steps, Text, VStack } from "@chakra-ui/react"
import { UilArrowLeft, UilTimes } from "@iconscout/react-unicons"
import { motion, AnimatePresence, useAnimate } from "framer-motion"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { BsCheck } from "react-icons/bs"

import { GrantsStepIndicator } from "./GrantsStepIndicator"
import { useWallet, useWalletModal } from "@vechain/vechain-kit"

export type Step = {
  key: string
  title: string
  image: string
  heading: string
  listItems: string[]
}

export const GrantsStepsCard = ({
  steps,
  isOpen,
  onClose,
}: {
  steps: Step[]
  isOpen: boolean
  onClose: () => void
}) => {
  const router = useRouter()
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const { account } = useWallet()
  const { open: openWalletModal } = useWalletModal()

  //MIMIC USE STEPS HOOK
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [scope, animate] = useAnimate()

  const goToNext = useCallback(() => {
    // Trigger button shrink animation before step change
    if (currentStepIndex === 0 && !isMobile) {
      animate(scope.current, { width: "120px" }, { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] })
    }
    setCurrentStepIndex(prev => prev + 1)
  }, [currentStepIndex, isMobile, animate, scope])

  const goToPrevious = useCallback(() => {
    setCurrentStepIndex(prev => prev - 1)
    // Trigger button expand animation when going back to step 0
    if (currentStepIndex === 1 && !isMobile) {
      animate(scope.current, { width: "160px" }, { duration: 0.55, ease: [0.25, 0.1, 0.25, 1] })
    }
  }, [currentStepIndex, isMobile, animate, scope])

  const currentStep = steps[currentStepIndex]
  const isLastStep = currentStepIndex === steps.length - 1

  //MIMIC use disclosure hook
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false)
  const openRequirementModal = useCallback(() => setIsRequirementModalOpen(true), [])
  const closeRequirementModal = useCallback(() => setIsRequirementModalOpen(false), [])

  const { hasMetProposalCriteria } = useMetProposalCriteria()

  const handleApply = useCallback(() => {
    if (!account?.address) {
      return openWalletModal()
    }

    if (!hasMetProposalCriteria) {
      return openRequirementModal()
    }
    router.push("/proposals/grants/new")
  }, [account?.address, hasMetProposalCriteria, router, openWalletModal, openRequirementModal])

  if (!currentStep) {
    return null
  }
  if (isMobile) {
    return (
      <BaseBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        ariaTitle={currentStep.title}
        ariaDescription={currentStep.heading}
        height="100%">
        <Steps.Root step={currentStepIndex} count={steps.length} size="sm">
          <HStack w="full" justify="space-between" alignItems="center">
            {currentStepIndex > 0 && <UilArrowLeft onClick={goToPrevious} cursor="pointer" />}
            <GrantsStepIndicator activeStep={currentStepIndex} steps={steps} />
            <UilTimes onClick={onClose} cursor="pointer" size={24} />
          </HStack>
          <Box pt={5}>
            <VStack w="full" textAlign="center" gap={4}>
              <Heading size="md" textStyle="heading">
                {currentStep.title}
              </Heading>
              <Image
                src={currentStep.image}
                alt={`Step ${currentStepIndex + 1}`}
                objectFit="contain"
                width={150}
                height={150}
              />
              <Heading size="sm" textStyle="heading">
                {currentStep.heading}
              </Heading>
              <List.Root pl={5} fontSize="sm" gap={2} color="gray.600" textAlign="left">
                {currentStep.listItems.map((item, index) => (
                  <List.Item key={`${item}-${index}`}>
                    <List.Indicator color="#004CFC">
                      <Icon as={BsCheck} />
                    </List.Indicator>
                    {item}
                  </List.Item>
                ))}
              </List.Root>
              <HStack w="full" justifyContent="flex-start" pt={5}>
                <Button variant="primaryAction" w="full" onClick={isLastStep ? handleApply : goToNext}>
                  {isLastStep ? t("Apply") : t("Next")}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Steps.Root>
      </BaseBottomSheet>
    )
  }

  return (
    <Card.Root display={isOpen ? "block" : "none"} w="full" h="full" borderRadius="xl" overflow="hidden">
      <Steps.Root step={currentStepIndex} count={steps.length}>
        <Flex h="full">
          <Box flex="1">
            <Box pl={8} pt={8} pb={4} w={{ base: "100%", lg: "35%" }}>
              <GrantsStepIndicator activeStep={currentStepIndex} steps={steps} />
            </Box>
            <VStack gap={10} alignItems="flex-start" w="full" p={10}>
              <VStack alignItems="flex-start" w="full">
                <Text fontSize="sm" fontWeight="bold" color="text.subtle">
                  {currentStep.title}
                </Text>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key={currentStep.key}
                  style={{ width: "100%" }}>
                  <VStack alignItems="flex-start" w="full">
                    <Heading size="xl" textStyle="heading">
                      {currentStep.heading}
                    </Heading>
                    {currentStep.listItems.length > 0 ? (
                      <List.Root pl={2} fontSize="sm" listStyle="disc">
                        {currentStep?.listItems?.map(item => (
                          <List.Item key={item} fontWeight="500" color="text.subtle">
                            {item}
                          </List.Item>
                        ))}
                      </List.Root>
                    ) : null}
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
                      <Button variant="primarySubtle" w="120px" onClick={goToPrevious}>
                        {t("Back")}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button ref={scope} variant="primaryAction" onClick={isLastStep ? handleApply : goToNext} w="120px">
                  {isLastStep ? t("Apply") : t("Next")}
                </Button>
              </HStack>
            </VStack>
          </Box>

          <Box bg="b3tr-balance-bg" w="32%" display="flex" alignItems="center" justifyContent="center">
            <Box position="absolute" top={3} right={5} p={0}>
              <UilTimes onClick={onClose} cursor="pointer" size={24} />
            </Box>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              key={currentStep.key}>
              <Image
                src={currentStep.image}
                alt={`Step ${currentStepIndex + 1}`}
                objectFit="contain"
                width={220}
                height={320}
              />
            </motion.div>
          </Box>
        </Flex>
        <RequirementModal
          isOpen={isRequirementModalOpen}
          onClose={closeRequirementModal}
          hasNft={hasMetProposalCriteria}
          isGrants
        />
      </Steps.Root>
    </Card.Root>
  )
}
