import { Text, VStack, HStack, Button, Image } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const TransactionApprovalModal = ({
  onApprove,
  onReject,
}: {
  onApprove?: () => void
  onReject?: () => void
}) => {
  const { t } = useTranslation()

  return (
    <VStack align={"center"} p={6} gap={2}>
      <Image src="/images/b3trvot3-tokens.png" boxSize={"200px"} alt="B3TR and VOT3 Tokens" />
      <Text
        style={{ fontFamily: "Instrument Sans, sans-serif" }}
        fontSize={28}
        fontWeight={700}
        data-testid={"tx-modal-title"}>
        {t("Waiting for confirmation")}
      </Text>
      <Text fontSize={16} fontWeight={400} textAlign={"center"}>
        {t("Confirm the operation to complete the transaction")}
      </Text>
      <HStack align="center" justify="center" p={6}>
        <Button variant="primaryAction" onClick={onApprove}>
          {t("Confirm")}
        </Button>
        <Button variant="dangerGhost" onClick={onReject}>
          {t("Reject")}
        </Button>
      </HStack>
    </VStack>
  )
}
