import { BaseModal } from "../BaseModal"
import { motion } from "framer-motion"
import { ReactNode } from "react"
import { Card, CardBody, Text, useMediaQuery, Box, Flex } from "@chakra-ui/react"
import { IoArrowBackOutline, IoClose } from "react-icons/io5"

export type Step<T extends string> = {
  key: T
  content: ReactNode
  title: string
  description?: string
}

export type StepModalProps<T extends string> = {
  isOpen: boolean
  onClose: () => void
  steps: Step<T>[]
  goToPrevious: () => void
  goToNext?: () => void
  setActiveStep: (step: number) => void
  activeStep: number
  disableBackButton?: boolean
  disableCloseButton?: boolean
}

export const StepModal = <T extends string>({
  isOpen,
  onClose,
  steps,
  activeStep,
  goToPrevious,
  setActiveStep,
  disableBackButton,
  disableCloseButton,
}: StepModalProps<T>) => {
  const handleClose = () => {
    // reset the active step to 0
    setActiveStep(0)
    // close the modal
    onClose()
  }
  const [isDesktop] = useMediaQuery("(min-width: 1060px)")

  const currentStepContent = steps[activeStep]

  const isFirstStep = activeStep === 0

  if (!currentStepContent) {
    return null
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      ariaTitle={currentStepContent.title}
      ariaDescription={currentStepContent.description}
      modalContentProps={{
        maxW: "container.md",
        w: "auto",
        bgColor: "#fff",
      }}
      closeButton={false}>
      <Card p={0}>
        <CardBody p={0}>
          <Flex position="relative" h="60px" alignItems="center">
            <Box position="absolute" left={0} p={0}>
              {!isFirstStep && !disableBackButton ? (
                <IoArrowBackOutline onClick={goToPrevious} size={30} cursor={"pointer"} />
              ) : null}
            </Box>

            <Flex
              justifyContent={["center", "center", "flex-start"]}
              pl={!isFirstStep && !disableBackButton && isDesktop ? 10 : 0}
              width="100%">
              <Text fontSize={{ base: 18, md: 24 }} fontWeight={700}>
                {currentStepContent.title}
              </Text>
            </Flex>

            {isDesktop && !disableCloseButton ? (
              <Box position="absolute" right={4}>
                <IoClose onClick={handleClose} size={30} cursor={"pointer"} />
              </Box>
            ) : null}
          </Flex>
          {currentStepContent?.description ? (
            <Text fontSize={{ base: 14, md: 16 }} fontWeight={400} px={4}>
              {currentStepContent?.description}
            </Text>
          ) : null}

          <motion.div initial="hidden" animate="visible" key={currentStepContent.key} style={{ width: "100%" }}>
            {currentStepContent.content}
          </motion.div>
        </CardBody>
      </Card>
    </BaseModal>
  )
}
