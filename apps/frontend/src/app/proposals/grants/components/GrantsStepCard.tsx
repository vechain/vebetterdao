/* eslint-disable react/no-array-index-key */
import { useTranslation } from "react-i18next"
import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Steps,
  Flex,
  Heading,
  Image,
  List,
  Card,
  useDisclosure,
  useSteps,
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { UilArrowLeft, UilCheck, UilTimes } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useMetProposalCriteria } from "@/api/contracts/governance"
import { RequirementModal } from "@/app/proposals/components/components"
import { useCallback } from "react"

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
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const router = useRouter()

  const stepsUI = useSteps({
    defaultStep: 0,
    count: steps.length,
  })

  const currentStep = steps[stepsUI.value]
  const isLastStep = stepsUI.value === steps.length - 1

  const goToNext = () => {
    if (stepsUI.value < steps.length - 1) {
      stepsUI.setStep(stepsUI.value + 1)
    }
  }

  const goToPrevious = () => {
    if (stepsUI.value > 0) {
      stepsUI.setStep(stepsUI.value - 1)
    }
  }

  const { open: isRequirementModalOpen, onOpen: openRequirementModal, onClose: closeRequirementModal } = useDisclosure()

  const hasMetProposalCriteria = useMetProposalCriteria()

  const handleApply = useCallback(() => {
    if (!hasMetProposalCriteria) {
      openRequirementModal()
    } else {
      router.push("/proposals/grants/new")
    }
  }, [openRequirementModal, router, hasMetProposalCriteria])

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
        <Steps.Root step={stepsUI.value} count={steps.length} size="sm">
          <HStack w="full" justify="space-between" alignItems="center">
            <UilArrowLeft onClick={goToPrevious} cursor="pointer" />
            <Steps.List width="70%">
              {steps.map((step, index) => (
                <Steps.Item key={step.key} index={index}>
                  <Steps.Indicator />
                  <Steps.Separator />
                </Steps.Item>
              ))}
            </Steps.List>
            <UilTimes onClick={onClose} cursor="pointer" size={24} />
          </HStack>
          <Box pt={5}>
            <VStack w="full" textAlign="center" gap={4}>
              <Heading size="md" textStyle="heading">
                {currentStep.title}
              </Heading>
              <Image
                src={currentStep.image}
                alt={`Step ${stepsUI.value + 1}`}
                objectFit="contain"
                maxW="150px"
                maxH="150px"
              />
              <Heading size="sm" textStyle="heading">
                {currentStep.heading}
              </Heading>
              <List.Root pl={5} fontSize="sm" gap={2} color="gray.600" textAlign="left">
                {currentStep.listItems.map((item, index) => (
                  <List.Item key={`${item}-${index}`}>
                    <List.Indicator asChild color="#004CFC">
                      <UilCheck />
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
      <Steps.Root step={stepsUI.value} count={steps.length}>
        <Flex h="full">
          <Box flex="1">
            <Box pl={8} pt={8} pb={4}>
              <Steps.List width="35%">
                {steps.map((step, index) => (
                  <Steps.Item key={step.key} index={index}>
                    <Steps.Indicator />
                    <Steps.Separator />
                  </Steps.Item>
                ))}
              </Steps.List>
            </Box>
            <VStack gap={10} alignItems="flex-start" w="full" p={10}>
              <VStack alignItems="flex-start" w="full">
                <Text fontSize="sm" fontWeight="bold" color="subtle.active">
                  {currentStep.title}
                </Text>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key={currentStep.key}
                  style={{ width: "100%" }}>
                  <VStack alignItems="flex-start" w="full">
                    <Heading size="md" textStyle="heading">
                      {currentStep.heading}
                    </Heading>
                    {currentStep.listItems.length > 0 ? (
                      <List.Root pl={2} fontSize="sm" listStyle="disc">
                        {currentStep?.listItems?.map(item => (
                          <List.Item key={item} fontWeight="500" color="subtle.active">
                            {item}
                          </List.Item>
                        ))}
                      </List.Root>
                    ) : null}
                  </VStack>
                </motion.div>
              </VStack>
              <HStack w="full" justifyContent="flex-start">
                {stepsUI.value > 0 && (
                  <Button variant="primarySubtle" onClick={goToPrevious}>
                    {t("Previous")}
                  </Button>
                )}
                <Button variant="primaryAction" onClick={isLastStep ? handleApply : goToNext}>
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={currentStep.key}>
              <Image
                src={currentStep.image}
                alt={`Step ${stepsUI.value + 1}`}
                objectFit="contain"
                maxW="220px"
                maxH="320px"
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
