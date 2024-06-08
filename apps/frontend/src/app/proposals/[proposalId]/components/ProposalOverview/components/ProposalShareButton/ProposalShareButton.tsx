import {
  Heading,
  VStack,
  ModalCloseButton,
  Modal,
  ModalOverlay,
  IconButton,
  useDisclosure,
  Box,
} from "@chakra-ui/react"
import Lottie from "react-lottie"
import loadingAnimation from "./loading.json"
import { motion } from "framer-motion"
import { ShareButtons } from "@/components/ShareButtons"
import { CustomModalContent } from "@/components"
import { ModalAnimation } from "@/components/TransactionModal/ModalAnimation"
import { UilShareAlt } from "@iconscout/react-unicons"
import { useCurrentProposal } from "@/api"

const containerVariants = {
  initial: {
    x: 30,
  },
  animate: {
    x: 0,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
}

export const ProposalShareButton = () => {
  const { onOpen, isOpen, onClose } = useDisclosure()
  const { proposal } = useCurrentProposal()
  return (
    <>
      <IconButton
        aria-label="share"
        rounded="full"
        bgColor="#E0E9FE"
        color="#004CFC"
        h="40px"
        w="40px"
        onClick={onOpen}>
        <UilShareAlt size="20px" />
      </IconButton>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        trapFocus={false}
        closeOnOverlayClick={status !== "waitingConfirmation" && status !== "pending"}
        isCentered={true}>
        <ModalOverlay />
        <CustomModalContent>
          <ModalAnimation>
            <ModalCloseButton top={4} right={4} />
            <motion.div initial="initial" animate="animate" variants={containerVariants}>
              <ModalCloseButton top={4} right={4} />
              <VStack align={"center"} p={6}>
                <Heading size="md">{"Share proposal"}</Heading>
                <Box my="10px">
                  <Lottie
                    style={{
                      pointerEvents: "none",
                    }}
                    options={{
                      loop: true,
                      autoplay: true,
                      animationData: loadingAnimation,
                    }}
                    height={200}
                    width={200}
                  />
                </Box>
                <ShareButtons
                  descriptionEncoded={encodeURIComponent(
                    `🌱 Amazing #VeBetterDAO proposal:\n\n${proposal.title}\n\nCheck it out: https://governance.vebetterdao.org/proposals/${proposal.id}\n\n💫 #VeBetterDAO #Vechain`,
                  )}
                />
              </VStack>
            </motion.div>
          </ModalAnimation>
        </CustomModalContent>
      </Modal>
    </>
  )
}
