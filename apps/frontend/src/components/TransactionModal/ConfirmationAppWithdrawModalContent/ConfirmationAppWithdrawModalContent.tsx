import { VStack, Text, Image, HStack } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import loadingAnimation from "./loading.json"
import Lottie from "react-lottie"

export type ConfirmationAppWithdrawModalContentProps = {
  b3trBalanceAfter?: string
  b3trWithdrawAmount?: string
}

const compactFormatter = getCompactFormatter(6)

export const ConfirmationAppWithdrawModalContent = ({
  b3trBalanceAfter,
  b3trWithdrawAmount,
}: ConfirmationAppWithdrawModalContentProps) => {
  const { t } = useTranslation()

  return (
    <VStack align={"center"} p={6} gap={2}>
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

      <Text style={{ fontFamily: "Instrument Sans, sans-serif" }} fontSize={28} fontWeight={700}>
        {t("Waiting for confirmation")}
      </Text>
      <Text fontSize={16} fontWeight={400} textAlign={"center"}>
        {t("Confirm the operation in your wallet to complete it")}
      </Text>
      <VStack w="full" mt={8}>
        {Number(b3trWithdrawAmount) >= 0 && (
          <HStack w="full" bg={"#F8F8F8"} borderRadius={8} p={4} justifyContent={"space-between"}>
            <Text fontSize={16} fontWeight={400}>
              {t("You'll withdraw")}
            </Text>

            <HStack>
              <Image src={"/images/logo/b3tr_logo_dark.svg"} boxSize={"20px"} alt="B3TR Icon" />
              <Text fontSize={20} fontWeight={700} style={{ fontFamily: "Instrument Sans, sans-serif" }}>
                {FormattingUtils.humanNumber(Number(b3trWithdrawAmount))}
              </Text>
            </HStack>
          </HStack>
        )}
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
      </VStack>
    </VStack>
  )
}
