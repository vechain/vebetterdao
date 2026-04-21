import { Button, Textarea, VStack, Text, Heading } from "@chakra-ui/react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { BaseModal } from "@/components/BaseModal"
import { useSubmitNavigatorReport } from "@/hooks/navigator/useSubmitNavigatorReport"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { toIPFSURL, uploadBlobToIPFS } from "@/utils/ipfs"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const NavigatorReportModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { data: reportInterval } = useGetReportInterval()
  const [reportText, setReportText] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const submitReport = useSubmitNavigatorReport({
    onSuccess: () => {
      onClose()
      setReportText("")
    },
  })

  const handleSubmit = useCallback(async () => {
    if (!reportText.trim()) return

    setIsUploading(true)
    try {
      const reportData = {
        content: reportText.trim(),
        submittedAt: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(reportData)], { type: "application/json" })
      const cid = await uploadBlobToIPFS(blob, "navigator-report.json")
      const reportURI = toIPFSURL(cid, "navigator-report.json")
      submitReport.sendTransaction({ reportURI })
    } catch (err) {
      console.error("Failed to upload report:", err)
    } finally {
      setIsUploading(false)
    }
  }, [reportText, submitReport])

  return (
    <BaseModal
      showCloseButton
      isCloseable
      ariaTitle="Submit Navigator Report"
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}>
      <VStack w="full" align="stretch" gap={4}>
        <Heading size="lg">{t("Submit Report")}</Heading>
        <Text textStyle="sm" color="text.subtle">
          {t("Required each {{interval}} rounds, otherwise optional.", { interval: reportInterval ?? 2 })}
        </Text>

        <Textarea
          placeholder={t("Share a link (X, PDF, etc.) or write your report")}
          value={reportText}
          onChange={e => setReportText(e.target.value)}
          resize="none"
          rows={6}
          fontSize="16px"
        />

        <Button
          variant="primary"
          w="full"
          disabled={!reportText.trim() || isUploading || submitReport.isTransactionPending}
          onClick={handleSubmit}>
          {isUploading ? t("Uploading...") : t("Submit Report")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
