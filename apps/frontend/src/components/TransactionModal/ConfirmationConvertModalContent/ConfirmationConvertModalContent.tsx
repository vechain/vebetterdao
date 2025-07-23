import { VStack, Text, Image, HStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import Lottie from "react-lottie"
import confirmationAnimation from "../ConfirmationModalContent/confirmation.json"

export type ConfirmationModalContentProps = {
  b3trBalanceAfter?: string
  vot3BalanceAfter?: string
}

const compactFormatter = getCompactFormatter(6)

export const ConfirmationConvertModalContent = ({
  b3trBalanceAfter,
  vot3BalanceAfter,
}: ConfirmationModalContentProps) => {
  const { t } = useTranslation()
  return (
    <VStack align={"center"} p={6} gap={2}>
      <Image src="/images/b3trvot3-tokens.png" boxSize={"200px"} alt="B3TR and VOT3 Tokens" />
      {/* @ts-ignore */}
      <Lottie
        style={{
          pointerEvents: "none",
        }}
        options={{
          loop: true,
          autoplay: true,
          animationData: confirmationAnimation,
        }}
        height={200}
        width={200}
      />
      <Text style={{ fontFamily: "Instrument Sans, sans-serif" }} fontSize={28} fontWeight={700}>
        {t("Waiting for confirmation")}
      </Text>
      <Text fontSize={16} fontWeight={400} textAlign={"center"}>
        {t("Confirm the operation in your wallet to complete the convertion")}
      </Text>
      <VStack w="full" mt={8}>
        {Number(b3trBalanceAfter) >= 0 && (
          <HStack w="full" bg={"#F8F8F8"} borderRadius={8} p={4} justifyContent={"space-between"}>
            <Text fontSize={16} fontWeight={400}>
              {t("Your new B3TR balance")}
            </Text>

            <HStack>
              <Image src={"/images/logo/b3tr_logo_dark.svg"} boxSize={"20px"} alt="B3TR Icon" />
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
              <Image src={"/images/logo/vot3_logo_dark.svg"} boxSize={"20px"} alt="VOT3 Icon" />
              <Text fontSize={20} fontWeight={700} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                {compactFormatter.format(Number(vot3BalanceAfter))}
              </Text>
            </HStack>
          </HStack>
        )}
      </VStack>
    </VStack>
  )
}
