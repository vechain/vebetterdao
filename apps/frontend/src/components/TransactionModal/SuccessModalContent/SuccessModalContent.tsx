import { Heading, Text, VStack, ModalCloseButton, Button } from "@chakra-ui/react"
import Lottie from "react-lottie"
import successAnimation from "./success.json"
import { ShareButtons } from "../../ShareButtons"
import { ReactNode } from "react"
import { ModalAnimation } from "../ModalAnimation"
import { motion } from "framer-motion"
import { getConfig } from "@repo/config"

export type SuccessModalContentProps = {
  title?: ReactNode
  showSocialButtons?: boolean
  socialDescription?: string
  showExplorerButton?: boolean
  txId?: string
}

/**
 * SuccessModalContent is a component that shows a success message with a lottie animation and share buttons
 * @param {SuccessModalContentProps} props - The props of the component
 * @param {boolean} props.isOpen - A boolean to control the visibility of the modal
 * @param {() => void} props.onClose - A function to close the modal
 * @param {string} props.title - The title of the modal
 * @param {string} props.socialDescription - The description to share on social media
 * @returns {React.ReactElement} The SuccessModalContent component
 */
export const SuccessModalContent = ({
  title = "Transaction completed!",
  showSocialButtons = false,
  socialDescription = "I've just completed a transaction on B3tr. Check it out!",
  showExplorerButton = false,
  txId,
}: SuccessModalContentProps) => {
  return (
    <ModalAnimation>
      <ModalCloseButton top={4} right={4} />
      <VStack align={"center"} p={6}>
        <Heading size="md">{title}</Heading>
        <motion.div
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
          }}
          animate={{
            scale: [1, 1.1, 1],
          }}>
          <Lottie
            style={{
              pointerEvents: "none",
            }}
            options={{
              loop: false,
              autoplay: true,
              animationData: successAnimation,
            }}
            height={200}
            width={200}
          />
        </motion.div>
        {showExplorerButton && txId && (
          <Button
            variant={"link"}
            onClick={() => {
              window.open(`${getConfig().network.explorerUrl}/txs/${txId}`, "_blank")
            }}
            size="sm"
            textDecoration={"underline"}>
            View it on the explorer
          </Button>
        )}
        {showSocialButtons && (
          <VStack>
            <Text fontSize="sm">Share your success on social media</Text>
            <ShareButtons description={socialDescription} />
          </VStack>
        )}
      </VStack>
    </ModalAnimation>
  )
}
