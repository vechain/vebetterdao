import { Heading, Text, VStack, Link, Image, HStack, Flex, Button } from "@chakra-ui/react"
import { ShareButtons } from "../../ShareButtons"
import { ReactNode, useState } from "react"
import { motion } from "framer-motion"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"
import { useTranslation } from "react-i18next"
import { AnalyticsUtils } from "@/utils"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "@/constants"
import { MdArrowOutward } from "react-icons/md"
export type SuccessModalContentProps = {
  title?: ReactNode
  showSocialButtons?: boolean
  socialDescriptionEncoded?: string
  txId?: string
  isSuccessBeenTrack?: boolean
  onClose: () => void
}

const okHandVariants = {
  initial: { rotateY: 0 },
  animate: {
    rotateY: [0, 180, 0, 180, 0],
    scale: [1, 1.1, 1, 1.1, 1],
    transition: {
      rotateY: {
        yoyo: Infinity,
        duration: 2,
      },
      scale: {
        yoyo: Infinity,
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  },
}

const MotionImage = motion(Image)
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
  txId,
  isSuccessBeenTrack,
  onClose,
}: SuccessModalContentProps) => {
  const { t } = useTranslation()

  const [isTracked, setIsTracked] = useState(isSuccessBeenTrack)

  if (isTracked && typeof title === "string") {
    AnalyticsUtils.trackEvent(title, buttonClickActions(ButtonClickProperties.SUCCESS_TX))
    setIsTracked(false)
  }
  return (
    <VStack align={"center"}>
      <MotionImage
        src="/assets/icons/ok-hand.svg"
        boxSize={"150px"}
        alt="B3TR Ok Hand"
        variants={okHandVariants}
        initial="initial"
        animate="animate"
      />
      <Heading size="lg" data-testid={"tx-modal-title"}>
        {title}
      </Heading>

      {showSocialButtons && (
        <VStack>
          <Text fontSize="sm">{t("Share your success on social media")}</Text>
          <ShareButtons descriptionEncoded={socialDescriptionEncoded} />
        </VStack>
      )}
      <Flex w={"full"} justifyContent={"center"} mt={6}>
        <Link
          href={getExplorerTxLink(txId)}
          isExternal
          color="gray.500"
          fontSize={"14px"}
          style={{ textDecoration: "none" }}
          onClick={() =>
            AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.SEE_DETAILS_TX))
          }>
          <HStack alignSelf={"center"}>
            <Text fontSize={14} fontWeight={500} color={"rgba(0, 76, 252, 1)"}>
              {t("See transaction information")}
            </Text>
            <MdArrowOutward size={20} color={"rgba(0, 76, 252, 1)"} />
          </HStack>
        </Link>
      </Flex>
      <HStack w={"full"} alignItems={"center"} justifyContent={"center"} gap={2} mt={4}>
        <Button variant={"primaryAction"} w={"50%"} py={6} onClick={onClose}>
          {t("Done")}
        </Button>
      </HStack>
    </VStack>
  )
}
