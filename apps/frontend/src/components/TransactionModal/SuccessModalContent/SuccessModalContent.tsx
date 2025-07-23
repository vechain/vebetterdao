import { Heading, Text, VStack, ModalCloseButton, Link } from "@chakra-ui/react"
import Lottie from "react-lottie"
import successAnimation from "./success.json"
import { ShareButtons } from "../../ShareButtons"
import { ReactNode } from "react"
import { ModalAnimation } from "../ModalAnimation"
import { motion } from "framer-motion"
import { getConfig } from "@repo/config"
import { useTranslation } from "react-i18next"

export type SuccessModalContentProps = {
  title?: ReactNode
  showSocialButtons?: boolean
  socialDescriptionEncoded?: string
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
  socialDescriptionEncoded = "%F0%9F%8C%B1%20Excited%20to%20contribute%20to%20a%20%23Better%20future%20with%20my%20latest%20activity%20on%20%23VeBetterDAO%21%0A%0AVisit%20https%3A%2F%2Fvebetterdao.org%20and%20start%20making%20a%20difference%20today%21%20%F0%9F%92%AB%0A%0A%23VeBetterDAO%20%23Vechain",
  showExplorerButton = false,
  txId,
}: SuccessModalContentProps) => {
  const { t } = useTranslation()
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
          {/* @ts-ignore */}
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
          <Link
            href={`${getConfig().network.explorerUrl}/txs/${txId}`}
            isExternal
            color="gray.500"
            fontSize={"14px"}
            textDecoration={"underline"}>
            {t("View it on the explorer")}
          </Link>
        )}
        {showSocialButtons && (
          <VStack>
            <Text fontSize="sm">{t("Share your success on social media")}</Text>
            <ShareButtons descriptionEncoded={socialDescriptionEncoded} />
          </VStack>
        )}
      </VStack>
    </ModalAnimation>
  )
}
