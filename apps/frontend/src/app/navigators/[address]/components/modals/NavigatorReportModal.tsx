import "@uiw/react-md-editor/markdown-editor.css"
import { Box, Button, Input, Text, VStack, Heading } from "@chakra-ui/react"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import rehypeSanitize from "rehype-sanitize"

import { useGetReportInterval } from "@/api/contracts/navigatorRegistry/hooks/useGetReportInterval"
import { BaseModal } from "@/components/BaseModal"
import { useSubmitNavigatorReport } from "@/hooks/navigator/useSubmitNavigatorReport"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { uploadBlobToIPFS } from "@/utils/ipfs"

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false })

type Props = {
  isOpen: boolean
  onClose: () => void
  initialLink?: string
  initialText?: string
}

const isValidUrl = (value: string): boolean => {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

export const NavigatorReportModal = ({ isOpen, onClose, initialLink, initialText }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const { data: reportInterval } = useGetReportInterval()
  const [link, setLink] = useState(initialLink ?? "")
  const [text, setText] = useState(initialText ?? "")
  const [isUploading, setIsUploading] = useState(false)

  const isEditMode = !!initialLink || !!initialText

  useEffect(() => {
    if (isOpen) {
      setLink(initialLink ?? "")
      setText(initialText ?? "")
    }
  }, [isOpen, initialLink, initialText])

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
      ariaTitle={isEditMode ? t("Edit Report") : t("Submit Report")}
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}>
      <VStack w="full" align="stretch" gap={4}>
        <Heading size="lg">{isEditMode ? t("Edit Report") : t("Submit Report")}</Heading>
        <Text textStyle="sm" color="text.subtle">
          {t("Provide a link, a note, or both.")}{" "}
          {t("Required each {{interval}} rounds, otherwise optional.", { interval: reportInterval ?? 2 })}
        </Text>

        <VStack align="stretch" gap={1}>
          <Text textStyle="xs" fontWeight="semibold">
            {t("Link")}
          </Text>
          <Input
            placeholder={t("Link to a twitter, reddit or blog post")}
            value={link}
            onChange={e => setLink(e.target.value)}
            fontSize="16px"
          />
          {linkError && (
            <Text textStyle="xs" color="status.negative.primary">
              {t("Invalid URL")}
            </Text>
          )}
        </VStack>

        <VStack align="stretch" gap={1}>
          <Text textStyle="xs" fontWeight="semibold">
            {t("Note")}
          </Text>
          <Box
            w="full"
            h={[260, 320]}
            className="wmde-markdown-var"
            border="1px solid"
            borderColor="border.primary"
            borderRadius="md"
            overflow="hidden">
            <MDEditor
              preview={"edit"}
              value={text}
              onChange={value => setText(value ?? "")}
              height="100%"
              textareaProps={{
                placeholder: t("Write your report or add additional context"),
              }}
              previewOptions={{
                rehypePlugins: [[rehypeSanitize]],
              }}
            />
          </Box>
        </VStack>

        <Button variant="primary" w="full" disabled={!canSubmit} onClick={handleSubmit}>
          {isUploading ? t("Uploading...") : isEditMode ? t("Update Report") : t("Submit Report")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
