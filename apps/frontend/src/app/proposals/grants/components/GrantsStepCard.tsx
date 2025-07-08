/* eslint-disable react/no-array-index-key */
import { useTranslation } from "react-i18next"
import { VStack, HStack, Text, Button, Box, Image, useSteps, Flex } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { GrantsStepIndicator } from "./GrantsStepIndicator"

export type Step = {
  key: string
  content: React.ReactNode
  title: string
  description?: string
  image: string
}

export const GrantsStepsCard = ({ steps }: { steps: Step[] }) => {
  const { t } = useTranslation()
  const { activeStep, goToNext, goToPrevious } = useSteps({
    index: 0,
    count: steps.length,
  })

  const currentStep = steps[activeStep]

  if (!currentStep) {
    return null
  }

  return (
    <Box w="full" h="full" bg="contrast-bg-muted" borderRadius="xl" overflow="hidden">
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
                  {currentStep.content}
                </motion.div>
              </VStack>
              <HStack w="full" justifyContent="flex-start">
                {activeStep > 0 && (
                  <Button variant="primarySubtle" onClick={goToPrevious}>
                    {t("Previous")}
                  </Button>
                )}
                <Button variant="primaryAction" onClick={goToNext} isDisabled={activeStep === steps.length - 1}>
                  {t("Next")}
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Box>

        <Box bg="b3tr-balance-bg" w="35%" display="flex" alignItems="center" justifyContent="center">
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
