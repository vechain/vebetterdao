/* eslint-disable react/no-array-index-key */
import { useTranslation } from "react-i18next"
import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  useSteps,
  Flex,
  UnorderedList,
  Heading,
  ListItem,
  Image,
  ListIcon,
  List,
  Card,
  useDisclosure,
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { GrantsStepIndicator } from "./GrantsStepIndicator"
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
  const { activeStep, goToNext, goToPrevious } = useSteps({
    index: 0,
    count: steps.length,
  })
  const { isMobile } = useBreakpoints()
  const router = useRouter()
  const currentStep = steps[activeStep]
  const isLastStep = activeStep === steps.length - 1

  const {
    isOpen: isRequirementModalOpen,
    onOpen: openRequirementModal,
    onClose: closeRequirementModal,
  } = useDisclosure()

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
        <HStack w="full" justify="space-between" alignItems="center">
          <UilArrowLeft onClick={goToPrevious} cursor="pointer" />
          <GrantsStepIndicator activeStep={activeStep} steps={steps} width="70%" />
          <UilTimes onClick={onClose} cursor="pointer" size={24} />
        </HStack>
        <Box pt={5}>
          <VStack w="full" textAlign="center" spacing={4}>
            <Heading size="md" textStyle="heading">
              {currentStep.title}
            </Heading>
            <Image
              src={currentStep.image}
              alt={`Step ${activeStep + 1}`}
              objectFit="contain"
              maxW="150px"
              maxH="150px"
            />
            <Heading size="sm" textStyle="heading">
              {currentStep.heading}
            </Heading>
            <List pl={5} fontSize="sm" spacing={2} color="gray.600" textAlign="left">
              {currentStep.listItems.map((item, index) => (
                <ListItem key={`${item}-${index}`}>
                  <ListIcon as={UilCheck} color="#004CFC" />
                  {item}
                </ListItem>
              ))}
            </List>
            <HStack w="full" justifyContent="flex-start" pt={5}>
              <Button variant="primaryAction" w="full" onClick={isLastStep ? handleApply : goToNext}>
                {isLastStep ? t("Apply") : t("Next")}
              </Button>
            </HStack>
          </VStack>
        </Box>
      </BaseBottomSheet>
    )
  }

  return (
    <Card display={isOpen ? "block" : "none"} w="full" h="full" borderRadius="xl" overflow="hidden">
      <Flex h="full">
        <Box flex="1">
          <Box pl={8} pt={8} pb={4}>
            <GrantsStepIndicator activeStep={activeStep} steps={steps} width="35%" />
          </Box>
          <VStack spacing={8} alignItems="flex-start" w="full" p={10} gap={10}>
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
                    <UnorderedList pl={2} fontSize="sm">
                      {currentStep?.listItems?.map(item => (
                        <ListItem key={item} fontWeight="500" color="subtle.active">
                          {item}
                        </ListItem>
                      ))}
                    </UnorderedList>
                  ) : null}
                </VStack>
              </motion.div>
            </VStack>
            <HStack w="full" justifyContent="flex-start">
              {activeStep > 0 && (
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
              alt={`Step ${activeStep + 1}`}
              objectFit="contain"
              maxW="220px"
              maxH="320px"
            />
          </motion.div>
        </Box>
        <RequirementModal
          isOpen={isRequirementModalOpen}
          onClose={closeRequirementModal}
          hasNft={hasMetProposalCriteria}
          isGrants
        />
      </Flex>
    </Card>
  )
}
