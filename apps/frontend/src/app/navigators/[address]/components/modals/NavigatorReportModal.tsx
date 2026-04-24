import { Button, Input, Text, Textarea, VStack, Heading } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { BaseModal } from "@/components/BaseModal"
import { useSubmitNavigatorReport } from "@/hooks/navigator/useSubmitNavigatorReport"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { uploadBlobToIPFS } from "@/utils/ipfs"

type Props = {
  isOpen: boolean
  onClose: () => void
}

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export const NavigatorReportModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { data: reportInterval } = useGetReportInterval()
  const [link, setLink] = useState("")
  const [text, setText] = useState("")
  const [isUploading, setIsUploading] = useState(false)

  const submitReport = useSubmitNavigatorReport({
    onSuccess: () => {
      onClose()
      setLink("")
      setText("")
    },
  })

  const linkTrimmed = link.trim()
  const textTrimmed = text.trim()
  const hasContent = !!linkTrimmed || !!textTrimmed
  const linkError = linkTrimmed && !isValidUrl(linkTrimmed)

  const canSubmit = useMemo(
    () => hasContent && !linkError && !isUploading && !submitReport.isTransactionPending,
    [hasContent, linkError, isUploading, submitReport.isTransactionPending],
  )

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return

    setIsUploading(true)
    try {
      const reportData = {
        ...(linkTrimmed && { link: linkTrimmed }),
        ...(textTrimmed && { text: textTrimmed }),
        submittedAt: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(reportData)], { type: "application/json" })
      const cid = await uploadBlobToIPFS(blob, "navigator-report.json")
      submitReport.sendTransaction({ reportURI: `ipfs://${cid}` })
    } catch (err) {
      console.error("Failed to upload report:", err)
    } finally {
      setIsUploading(false)
    }
  }, [canSubmit, linkTrimmed, textTrimmed, submitReport])

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
          {t("Provide a link, a note, or both.")}{" "}
          {t("Required each {{interval}} rounds, otherwise optional.", { interval: reportInterval ?? 2 })}
        </Text>

        <VStack align="stretch" gap={1}>
          <Text textStyle="xs" fontWeight="semibold">
            {t("Link (optional)")}
          </Text>
          <Input placeholder={t("https://...")} value={link} onChange={e => setLink(e.target.value)} fontSize="16px" />
          {linkError && (
            <Text textStyle="xs" color="status.negative.primary">
              {t("Invalid URL")}
            </Text>
          )}
        </VStack>

        <VStack align="stretch" gap={1}>
          <Text textStyle="xs" fontWeight="semibold">
            {t("Note (optional)")}
          </Text>
          <Textarea
            placeholder={t("Write your report or add additional context")}
            value={text}
            onChange={e => setText(e.target.value)}
            resize="none"
            rows={4}
            fontSize="16px"
          />
        </VStack>

        <Button variant="primary" w="full" disabled={!canSubmit} onClick={handleSubmit}>
          {isUploading ? t("Uploading...") : t("Submit Report")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
