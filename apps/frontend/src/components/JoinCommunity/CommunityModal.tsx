import { Card, Dialog, VStack, Text, CloseButton } from "@chakra-ui/react"
import { CustomModalContent } from "../CustomModalContent"
import { useCallback } from "react"
import { DiscordButton, FreshDeskButton, TelegramButton } from "../Footer"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"

type Props = {
  isOpen: boolean
  onClose: () => void
}

const variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
}

const MotionVStack = motion(VStack)

export const CommunityModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()

  const renderCardContent = useCallback(() => {
    return (
      <Card.Body>
        <Dialog.CloseTrigger top={6} right={4} asChild>
          <CloseButton />
        </Dialog.CloseTrigger>
        <Text textStyle="xl" fontWeight="bold">
          {t("Join Our Community!")}
        </Text>
        <MotionVStack
          initial="hidden"
          animate="visible"
          variants={variants}
          align={"flex-start"}
          maxW={"590px"}
          minW={{ base: "90vw", md: "350px" }}
          gap={2}
          mt={6}>
          <motion.div variants={itemVariants} style={{ width: "100%" }}>
            <DiscordButton isFullWidth />
          </motion.div>
          <motion.div variants={itemVariants} style={{ width: "100%" }}>
            <TelegramButton isFullWidth />
          </motion.div>
          <motion.div variants={itemVariants} style={{ width: "100%" }}>
            <FreshDeskButton isFullWidth />
          </motion.div>
        </MotionVStack>
      </Card.Body>
    )
  }, [t])

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={details => {
        if (!details.open) onClose()
      }}
      placement="center"
      trapFocus={true}>
      <CustomModalContent w={"auto"} maxW="breakpoint-md">
        <Card.Root rounded={20}>{renderCardContent()}</Card.Root>
      </CustomModalContent>
    </Dialog.Root>
  )
}
