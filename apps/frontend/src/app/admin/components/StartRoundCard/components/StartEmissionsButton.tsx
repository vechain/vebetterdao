import { HStack, Button } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useCurrentAllocationsRoundId } from "../../../../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useStartEmission } from "../../../../../hooks/useStartEmission"

export const StartEmissionsButton = () => {
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { t } = useTranslation()
  const { sendTransaction, isTransactionPending, status } = useStartEmission({})
  const handleStartEmissions = useCallback(() => {
    sendTransaction()
  }, [sendTransaction])
  const loading = isTransactionPending || status === "pending"
  if (parseInt(currentRoundId ?? "0") > 0) return null
  return (
    <HStack gap={12}>
      <Button
        disabled={parseInt(currentRoundId ?? "0") > 0}
        colorPalette="blue"
        onClick={handleStartEmissions}
        loading={loading}
        data-testid={"start-voting-round-button"}>
        {t("Start emissions")}
      </Button>
    </HStack>
  )
}
