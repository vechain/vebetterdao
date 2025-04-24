import { VStack, Text, HStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import loadingAnimation from "./loading.json"
import LazyLottie from "@/app/components/LazyLottie"
import { B3TRIcon } from "@/components/Icons"

export type ConfirmationRefillPoolsModalContentProps = {
  b3trBalanceAfter?: string
  b3trAmount?: string
  isRewardsPoolToAppBalance?: boolean
  isEnablingRewardsPool?: boolean
}

const compactFormatter = getCompactFormatter(6)

export const ConfirmationRefillPoolsModalContent = ({
  b3trBalanceAfter,
  b3trAmount,
  isRewardsPoolToAppBalance,
  isEnablingRewardsPool,
}: ConfirmationRefillPoolsModalContentProps) => {
  const { t } = useTranslation()

  return (
    <VStack align={"center"} p={6} gap={2}>
      <LazyLottie
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

      <Text
        style={{ fontFamily: "Instrument Sans, sans-serif" }}
        fontSize={28}
        fontWeight={700}
        data-testid={"tx-modal-title"}>
        {t("Waiting for confirmation")}
      </Text>
      <Text fontSize={16} fontWeight={400} textAlign={"center"}>
        {t("Confirm the operation in your wallet to complete it")}
      </Text>
      <VStack w="full" mt={8}>
        {Number(b3trAmount) >= 0 && (
          <HStack w="full" bg={"#F8F8F8"} borderRadius={8} p={4} justifyContent={"space-between"}>
            <Text fontSize={16} fontWeight={400}>
              {isEnablingRewardsPool
                ? t("You'll enable and refill the rewards pool to")
                : isRewardsPoolToAppBalance
                  ? t("You'll refill the app balance to")
                  : t("You'll refill the rewards pool to")}
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
              {isRewardsPoolToAppBalance ? t("Your new B3TR app balance") : t("Your new B3TR app rewards pool")}
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
    </VStack>
  )
}
