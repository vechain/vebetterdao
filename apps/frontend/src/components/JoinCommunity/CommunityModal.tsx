import { Card, CardBody, Modal, ModalCloseButton, ModalOverlay, VStack, Text } from "@chakra-ui/react"
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
      <CardBody>
        <ModalCloseButton top={6} right={4} />
        <Text fontSize={20} fontWeight={700}>
          {t("Join Our Community!")}
        </Text>
        <MotionVStack
          initial="hidden"
          animate="visible"
          variants={variants}
          align={"flex-start"}
          maxW={"590px"}
          minW={{ base: "90vw", md: "350px" }}
          px={4}
          spacing={2}
          mt={6}>
          <motion.div variants={itemVariants}>
            <DiscordButton isFullWidth />
          </motion.div>
          <motion.div variants={itemVariants}>
            <TelegramButton isFullWidth />
          </motion.div>
          <motion.div variants={itemVariants}>
            <FreshDeskButton isFullWidth />
          </motion.div>
        </MotionVStack>
      </CardBody>
    )
  }, [t])

  return (
    <Modal isOpen={isOpen} onClose={onClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent w={"auto"} maxW={"container.md"}>
        <Card rounded={20}>{renderCardContent()}</Card>
      </CustomModalContent>
    </Modal>
  )
}
