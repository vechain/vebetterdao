import { VStack, Text, Image, HStack, Flex, Button, Link } from "@chakra-ui/react"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { MdArrowOutward } from "react-icons/md"
import { ButtonClickProperties, buttonClickActions, buttonClicked } from "@/constants"
import { AnalyticsUtils } from "@/utils"
import { B3TRIcon } from "@/components/Icons"

export type ConfirmationModalContentProps = {
  b3trBalanceAfter?: string
  vot3BalanceAfter?: string
  txId?: string
  onClose: () => void
}

const compactFormatter = getCompactFormatter(6)

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

export const SuccessConvertModalContent = ({
  b3trBalanceAfter,
  vot3BalanceAfter,
  txId,
  onClose,
}: ConfirmationModalContentProps) => {
  const { t } = useTranslation()

  return (
    <VStack align={"center"} p={8} gap={2}>
      <MotionImage
        src="/assets/icons/ok-hand.svg"
        boxSize={"150px"}
        alt="B3TR Ok Hand"
        variants={okHandVariants}
        initial="initial"
        animate="animate"
      />
      <Text
        style={{ fontFamily: "Instrument Sans, sans-serif" }}
        fontSize={28}
        fontWeight={700}
        data-testid={"tx-modal-title"}>
        {t("Conversion complete!")}
      </Text>
      <Text fontSize={16} fontWeight={400} textAlign={"center"}>
        {t("Your token balance has been updated")}
      </Text>
      <VStack w="full" mt={8}>
        {Number(b3trBalanceAfter) >= 0 && (
          <HStack w="full" bg={"#F8F8F8"} borderRadius={8} p={4} justifyContent={"space-between"}>
            <Text fontSize={16} fontWeight={400}>
              {t("Your new B3TR balance")}
            </Text>

            <HStack>
              <B3TRIcon boxSize={"20px"} />
              <Text fontSize={20} fontWeight={700} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                {compactFormatter.format(Number(b3trBalanceAfter))}
              </Text>
            </HStack>
          </HStack>
        )}
        {Number(vot3BalanceAfter) >= 0 && (
          <HStack w="full" bg={"#F8F8F8"} borderRadius={8} p={4} justifyContent={"space-between"}>
            <Text fontSize={16} fontWeight={400}>
              {t("Your new VOT3 balance")}
            </Text>

            <HStack>
              <Image src={"/assets/logos/vot3_logo_dark.webp"} boxSize={"20px"} alt="VOT3 Icon" />
              <Text fontSize={20} fontWeight={700} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                {compactFormatter.format(Number(vot3BalanceAfter))}
              </Text>
            </HStack>
          </HStack>
        )}
      </VStack>
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
      <Button
        mt={2}
        type="submit"
        variant={"primaryAction"}
        rounded={"full"}
        size={{ base: "md", md: "lg" }}
        w={{ base: "full", md: "auto" }}
        onClick={() => {
          onClose()
          AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.SWAP_CONFIRMED))
        }}
        data-testid={"close-swap-modal-button"}>
        {t("Continue")}
      </Button>
    </VStack>
  )
}
