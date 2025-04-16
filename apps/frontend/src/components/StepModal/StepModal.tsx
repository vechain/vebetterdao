import { BaseModal } from "../BaseModal"
import { motion } from "framer-motion"
import { ReactNode } from "react"
import { Card, CardBody, Step, HStack, Text } from "@chakra-ui/react"
import { IoArrowBackOutline } from "react-icons/io5"

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
  variants?: {
    hidden: object
    visible: object
  }
  disableBackButton?: boolean
}

const zoomInVariants = {
  hidden: { scale: 0.95, opacity: 0.8 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
}

export const StepModal = <T extends string>({
  isOpen,
  onClose,
  steps,
  activeStep,
  goToPrevious,
  setActiveStep,
  variants = zoomInVariants,
  disableBackButton = false,
}: StepModalProps<T>) => {
  const handleClose = () => {
    // reset the active step to 0
    setActiveStep(0)
    // close the modal
    onClose()
  }
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
      }}>
      <Card p={0}>
        <CardBody p={0}>
          <HStack>
            {!isFirstStep && !disableBackButton ? (
              <IoArrowBackOutline onClick={goToPrevious} size={30} cursor={"pointer"} />
            ) : null}
            <Text fontSize={{ base: 18, md: 24 }} fontWeight={700} alignSelf={"center"}>
              {currentStepContent.title}
            </Text>
          </HStack>
          {currentStepContent?.description ? (
            <Text fontSize={{ base: 14, md: 16 }} fontWeight={400} alignSelf={"center"}>
              {currentStepContent?.description}
            </Text>
          ) : null}

          <motion.div
            initial="hidden"
            animate="visible"
            variants={variants}
            key={currentStepContent.key}
            style={{ width: "100%" }}>
            {currentStepContent.content}
          </motion.div>
        </CardBody>
      </Card>
    </BaseModal>
  )
}
