import { Text, useMediaQuery, Flex, Button, Icon, Dialog } from "@chakra-ui/react"
import { motion } from "framer-motion"
import { ReactNode } from "react"
import { IoArrowBackOutline, IoClose } from "react-icons/io5"

import { BaseModal } from "../BaseModal"

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
  closeOnInteractOutside?: boolean
  modalContentProps?: Partial<Dialog.ContentProps>
  useStandardCloseButton?: boolean
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
  closeOnInteractOutside = false,
  modalContentProps,
  useStandardCloseButton = false,
}: StepModalProps<T>) => {
  const handleClose = () => {
    setActiveStep(0)
    onClose()
  }
  const [isDesktop] = useMediaQuery(["(min-width: 1060px)"])
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
        maxW: "breakpoint-md",
        w: "auto",
        p: 6,
        pt: 2,
        ...modalContentProps,
      }}
      modalBodyProps={{
        p: 0,
      }}
      showCloseButton={useStandardCloseButton}
      isCloseable={true}
      modalProps={{ closeOnInteractOutside }}>
      <Flex position="relative" h="60px" alignItems="center">
        {!isFirstStep && !disableBackButton ? (
          <Button variant={"ghost"} position="absolute" left={0} p={0} onClick={goToPrevious}>
            <Icon as={IoArrowBackOutline} boxSize="30px" />
          </Button>
        ) : null}

        <Flex
          justifyContent={["center", "center", "flex-start"]}
          pl={!isFirstStep && !disableBackButton && isDesktop ? 10 : 0}
          width="100%">
          <Text textStyle={{ base: "lg", md: "2xl" }} fontWeight="bold">
            {currentStepContent.title}
          </Text>
        </Flex>

        {isDesktop && !disableCloseButton && !useStandardCloseButton ? (
          <Button position="absolute" variant={"ghost"} right={0} onClick={handleClose}>
            <Icon as={IoClose} boxSize="30px" />
          </Button>
        ) : null}
      </Flex>
      {currentStepContent?.description ? (
        <Text textStyle={{ base: "sm", md: "md" }} px={4}>
          {currentStepContent?.description}
        </Text>
      ) : null}

      <motion.div initial="hidden" animate="visible" key={currentStepContent.key} style={{ width: "100%" }}>
        {currentStepContent.content}
      </motion.div>
    </BaseModal>
  )
}
