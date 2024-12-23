import { B3TRIcon } from "@/components/Icons"
import { VStack, Text, Image, Flex, Button, Link, HStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { MdArrowOutward } from "react-icons/md"

export type SuccessAppBalanceModalContentContentProps = {
  b3trAmount?: string
  b3trBalanceAfter?: string
  isDeposit?: boolean
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

export const SuccessAppBalanceModalContent = ({
  b3trBalanceAfter,
  b3trAmount,
  isDeposit,
  txId,
  onClose,
}: SuccessAppBalanceModalContentContentProps) => {
  const { t } = useTranslation()

  return (
    <VStack align={"center"} p={8} gap={2}>
      <MotionImage
        src="/images/ok-hand.svg"
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
        {isDeposit ? t("Deposit complete!") : t("Withdrawal complete!")}
      </Text>

      <Flex w={"full"} justifyContent={"center"} mt={6}>
        <Link
          href={`${getConfig().network.explorerUrl}/transaction/${txId}`}
          isExternal
          color="gray.500"
          fontSize={"14px"}
          style={{ textDecoration: "none" }}>
          <HStack alignSelf={"center"}>
            <Text fontSize={14} fontWeight={500} color={"rgba(0, 76, 252, 1)"}>
              {t("See transaction information")}
            </Text>
            <MdArrowOutward size={20} color={"rgba(0, 76, 252, 1)"} />
          </HStack>
        </Link>
      </Flex>

      <VStack w="full" mt={8}>
        {Number(b3trAmount) >= 0 && (
          <HStack w="full" bg={"#F8F8F8"} borderRadius={8} p={4} justifyContent={"space-between"}>
            <Text fontSize={16} fontWeight={400}>
              {isDeposit ? t("You deposited") : t("You withdrew")}
            </Text>

            <HStack>
              <B3TRIcon boxSize={"20px"} />
              <Text fontSize={20} fontWeight={700} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                {compactFormatter.format(Number(b3trAmount))}
              </Text>
            </HStack>
          </HStack>
        )}
        {Number(b3trBalanceAfter) >= 0 && (
          <HStack w="full" bg={"#F8F8F8"} borderRadius={8} p={4} justifyContent={"space-between"}>
            <Text fontSize={16} fontWeight={400}>
              {t("Your app new B3TR balance")}
            </Text>

            <HStack>
              <B3TRIcon boxSize={"20px"} />
              <Text fontSize={20} fontWeight={700} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                {compactFormatter.format(Number(b3trBalanceAfter))}
              </Text>
            </HStack>
          </HStack>
        )}
      </VStack>

      <Button
        mt={2}
        type="submit"
        variant={"primaryAction"}
        rounded={"full"}
        size={{ base: "md", md: "lg" }}
        w={{ base: "full", md: "auto" }}
        onClick={onClose}>
        {t("Continue")}
      </Button>
    </VStack>
  )
}
