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
} from "@chakra-ui/react"
import { motion } from "framer-motion"
import { GrantsStepIndicator } from "./GrantsStepIndicator"
import { BaseBottomSheet } from "@/components/BaseBottomSheet"
import { useBreakpoints } from "@/hooks/useBreakpoints"
import { UilArrowLeft, UilCheck, UilTimes } from "@iconscout/react-unicons"

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

  const currentStep = steps[activeStep]
  const isLastStep = activeStep === steps.length - 1
  const handleApply = () => {
    window.alert("Go to apply page")
  }

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
          <UilTimes onClick={onClose} cursor="pointer" size={24} color="gray.600" />
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
    <Box
      display={isOpen ? "block" : "none"}
      w="full"
      h="full"
      bg="contrast-bg-muted"
      borderRadius="xl"
      overflow="hidden">
      <Flex h="full">
        <Box flex="1">
          <Box pl={8} pt={8} pb={4}>
            <GrantsStepIndicator activeStep={activeStep} steps={steps} width="35%" />
          </Box>
          <Box pl={8} pb={5} pt={5}>
            <VStack spacing={8} alignItems="flex-start" w="full">
              <VStack alignItems="flex-start" w="full">
                <Text fontSize="sm" fontWeight="medium">
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
                          <ListItem key={item}>{item}</ListItem>
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
        </Box>

        <Box bg="b3tr-balance-bg" w="32%" display="flex" alignItems="center" justifyContent="center">
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
      </Flex>
    </Box>
  )
}
