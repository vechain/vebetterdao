import { HStack, VStack, Text, Image, Button } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"

import { B3TRIcon } from "../../../../Icons/B3TRIcon"

const compactFormatter = getCompactFormatter(4)
type Props = {
  b3trBalanceAfterSwap: string
  vot3BalanceAfterSwap: string
  onSubmitTx: () => void
}
export const ReviewSwapContent = ({ b3trBalanceAfterSwap, vot3BalanceAfterSwap, onSubmitTx }: Props) => {
  const { t } = useTranslation()
  return (
    <VStack align={"center"} p={0} gap={2}>
      <Image src="/assets/tokens/b3trvot3-tokens.webp" boxSize={"200px"} alt="B3TR and VOT3 Tokens" />
      <Text textStyle="md" textAlign={"center"}>
        {t("By confirming the operation in your wallet, you will complete the conversion")}
      </Text>
      <VStack w="full" mt={8}>
        {Number(b3trBalanceAfterSwap) >= 0 && (
          <HStack w="full" bg="bg.primary" borderRadius={8} p={4} justifyContent={"space-between"}>
            <Text textStyle="md">{t("Your new B3TR balance")}</Text>
            <HStack>
              <B3TRIcon boxSize={"20px"} />
              <Text textStyle="xl" fontWeight="bold">
                {compactFormatter.format(Number(b3trBalanceAfterSwap))}
              </Text>
            </HStack>
          </HStack>
        )}
        {Number(vot3BalanceAfterSwap) >= 0 && (
          <HStack w="full" bg="bg.primary" borderRadius={8} p={4} justifyContent={"space-between"}>
            <Text textStyle="md">{t("Your new VOT3 balance")}</Text>
            <HStack>
              <Image src="/assets/tokens/vot3-token.webp" boxSize={"20px"} alt="VOT3 Icon" />
              <Text textStyle="xl" fontWeight="bold">
                {compactFormatter.format(Number(vot3BalanceAfterSwap))}
              </Text>
            </HStack>
          </HStack>
        )}
      </VStack>
      <Button
        variant={"primary"}
        w={"full"}
        rounded={"full"}
        onClick={onSubmitTx}
        size={"lg"}
        py={4}
        mt={4}
        data-testid={"confirm-swap-button"}>
        <Text color="white" textStyle={{ base: "sm", md: "lg" }}>
          {t("Confirm conversion")}
        </Text>
      </Button>
    </VStack>
  )
}
